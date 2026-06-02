import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { useBranchesDropdown } from '../../hooks/useBranchProfilesList';
import {
  useTeacherTimetable,
  useTeachingStaffForTT,
} from '../../hooks/useTimetable';
import {
  DAYS,
  DAY_LABELS,
  PERIOD_PILL,
  currentAcademicYear,
  titleCase,
} from '../../constants/timetable';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

export default function MyTimetablePanel() {
  const C = useColors();
  const { user } = useUserStore();

  const isAdmin = !!user?.role?.isPredefined;
  const canPickOther =
    isAdmin || !!user?.role?.actions?.includes('view-all-branch-timetable');

  const ownStaffId =
    user?.staffId ||
    user?.staff?._id ||
    user?.staff_id ||
    (user?.staffType === 'teaching' ? user?._id : '');

  const [staffId, setStaffId] = useState(ownStaffId || '');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState('');
  const [day, setDay] = useState('mon');

  const { data: branchData } = useBranchesDropdown({ enabled: canPickOther });
  const branches = branchData?.data || [];

  const { data: staffData } = useTeachingStaffForTT({
    branchId: branchId || undefined,
    enabled: canPickOther,
  });
  const teachers = staffData?.data || [];

  const { data: ttRes, isFetching } = useTeacherTimetable({
    staffId,
    academicYear,
    enabled: !!staffId,
  });
  const grid = ttRes?.data?.grid || {};
  const schedule = ttRes?.data?.periods?.[0];
  const schedulePeriods = schedule?.periods || [];
  const workingDays = useMemo(
    () =>
      (schedule?.workingDays?.length ? schedule.workingDays : DAYS).filter((d) =>
        DAYS.includes(d),
      ),
    [schedule?.workingDays],
  );

  // Snap selected day to a working day
  useEffect(() => {
    if (workingDays.length && !workingDays.includes(day)) {
      setDay(workingDays[0]);
    }
  }, [workingDays, day]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        {canPickOther && (
          <>
            {branches.length > 0 && (
              <View>
                <Text style={[styles.label, { color: C.muted }]}>BRANCH</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    onPress={() => setBranchId('')}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: C.bg, borderColor: C.border },
                      !branchId && styles.chipActive,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: C.text },
                        !branchId && styles.chipTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </Pressable>
                  {branches.map((b) => {
                    const active = branchId === b._id;
                    return (
                      <Pressable
                        key={b._id}
                        onPress={() => setBranchId(b._id)}
                        style={({ pressed }) => [
                          styles.chip,
                          { backgroundColor: C.bg, borderColor: C.border },
                          active && styles.chipActive,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: C.text },
                            active && styles.chipTextActive,
                          ]}
                        >
                          {b.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View>
              <Text style={[styles.label, { color: C.muted }]}>TEACHER</Text>
              {teachers.length === 0 ? (
                <Text style={[styles.helper, { color: C.mutedSoft }]}>
                  No teaching staff.
                </Text>
              ) : (
                <View style={styles.chipRow}>
                  {teachers.map((t) => {
                    const active = staffId === t._id;
                    return (
                      <Pressable
                        key={t._id}
                        onPress={() => setStaffId(t._id)}
                        style={({ pressed }) => [
                          styles.chip,
                          { backgroundColor: C.bg, borderColor: C.border },
                          active && styles.chipActive,
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: C.text },
                            active && styles.chipTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {t.user?.name || t.designation || '?'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}

        <View>
          <Text style={[styles.label, { color: C.muted }]}>ACADEMIC YEAR</Text>
          <TextInput
            value={academicYear}
            onChangeText={setAcademicYear}
            placeholder="2025-2026"
            placeholderTextColor={C.mutedSoft}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            style={[styles.input, { color: C.text, borderColor: C.border, backgroundColor: C.bg }]}
          />
        </View>
      </View>

      {!staffId ? (
        <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
          <Feather name="user-x" size={28} color={C.mutedSoft} />
          <Text style={[styles.emptyText, { color: C.muted }]}>
            {canPickOther
              ? 'Pick a teacher to view their schedule.'
              : 'No teaching staff record linked to your account.'}
          </Text>
        </View>
      ) : isFetching && schedulePeriods.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : !schedulePeriods.length ? (
        <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
          <Feather name="calendar" size={28} color={C.mutedSoft} />
          <Text style={[styles.emptyText, { color: C.muted }]}>
            No classes assigned for {academicYear}.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.label, { color: C.muted }]}>DAY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.chipRow, { paddingRight: 8 }]}>
                {workingDays.map((d) => {
                  const active = day === d;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDay(d)}
                      style={({ pressed }) => [
                        styles.dayChip,
                        { backgroundColor: C.bg, borderColor: C.border },
                        active && styles.chipActive,
                        pressed && { opacity: 0.85 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          { color: active ? '#fff' : C.text },
                        ]}
                      >
                        {DAY_LABELS[d]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {schedulePeriods.map((p) => {
            const cfg = PERIOD_PILL[p.type] || PERIOD_PILL.other;
            const isLesson = p.type === 'lesson';
            const slot = grid?.[day]?.[p.number];
            return (
              <View
                key={p.number}
                style={[styles.periodCard, { backgroundColor: C.card, borderColor: C.border }]}
              >
                <View style={styles.periodHeader}>
                  <View style={styles.numBadge}>
                    <Text style={styles.numBadgeText}>{p.number}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.periodName, { color: C.text }]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={[styles.periodTime, { color: C.muted }]}>
                      {p.startTime} – {p.endTime}
                    </Text>
                  </View>
                  <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.typePillText, { color: cfg.fg }]}>
                      {titleCase(p.type)}
                    </Text>
                  </View>
                </View>
                {!isLesson ? (
                  <Text style={[styles.nonLesson, { color: C.muted, backgroundColor: C.bg }]}>
                    {titleCase(p.type)}
                  </Text>
                ) : slot ? (
                  <View style={styles.slotBlock}>
                    <Text style={[styles.slotName, { color: C.text }]} numberOfLines={1}>
                      {slot.subject?.name || slot.customLabel || '—'}
                    </Text>
                    <Text style={[styles.slotMeta, { color: C.muted }]} numberOfLines={1}>
                      {slot.class?.name || ''}
                      {slot.section?.name ? ` · ${slot.section.name}` : ''}
                    </Text>
                    {!!slot.room && (
                      <View style={styles.roomPill}>
                        <Feather name="map-pin" size={11} color="#374151" />
                        <Text style={styles.roomPillText}>{slot.room}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.free, { color: C.mutedSoft }]}>Free</Text>
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 32, gap: 12 },

  card: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 10 },
  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700', marginBottom: 4 },
  helper: { fontSize: 12 },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 220,
  },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dayChipText: { fontSize: 13, fontWeight: '700' },

  empty: {
    borderRadius: 14,
    paddingVertical: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 13, textAlign: 'center' },

  periodCard: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 8 },
  periodHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numBadge: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  periodName: { fontSize: 14, fontWeight: '800' },
  periodTime: { fontSize: 11, marginTop: 1 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typePillText: { fontSize: 10, fontWeight: '800' },

  slotBlock: { gap: 4 },
  slotName: { fontSize: 14, fontWeight: '800' },
  slotMeta: { fontSize: 12 },

  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roomPillText: { color: '#374151', fontWeight: '700', fontSize: 11 },

  free: { fontSize: 12, fontStyle: 'italic' },
  nonLesson: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    textAlign: 'center',
  },
});
