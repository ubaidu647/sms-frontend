import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AttendancePickers from './AttendancePickers';
import { useWeekDaily } from '../../hooks/useAttendance';
import {
  STATUS_PILL,
  currentAcademicYear,
  todayISO,
  startOfWeek,
  weekDates,
  addDaysISO,
  fmtDayShort,
  fmtDayNum,
} from '../../constants/attendance';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

export default function CalendarViewPanel() {
  const C = useColors();

  const [branchId, setBranchId] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const [anchorDate, setAnchorDate] = useState(todayISO());
  const weekStart = startOfWeek(anchorDate);
  const dates = weekDates(weekStart);
  const todayKey = todayISO();

  const queries = useWeekDaily({ classId, sectionId, dates });
  const isLoading = queries.some((q) => q.isLoading);

  const { students, statusMap } = useMemo(() => {
    const map = new Map();
    const sMap = {};
    queries.forEach((q) => {
      const d = q.data?.data;
      if (!d?.roster) return;
      for (const r of d.roster) {
        if (!map.has(r.studentId)) {
          map.set(r.studentId, r);
          sMap[r.studentId] = {};
        }
        if (r.attendance?.status) sMap[r.studentId][d.date] = r.attendance.status;
      }
    });
    return { students: Array.from(map.values()), statusMap: sMap };
  }, [queries]);

  const rangeLabel = `${fmtRange(weekStart)} – ${fmtRange(addDaysISO(weekStart, 6))}`;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
    >
      <AttendancePickers
        branchId={branchId}
        setBranchId={setBranchId}
        academicYear={academicYear}
        setAcademicYear={setAcademicYear}
        classId={classId}
        setClassId={setClassId}
        sectionId={sectionId}
        setSectionId={setSectionId}
      />

      <View
        style={[
          styles.weekNav,
          { backgroundColor: C.card, borderColor: C.border },
        ]}
      >
        <Pressable
          onPress={() => setAnchorDate(addDaysISO(weekStart, -7))}
          hitSlop={10}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: C.bg },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Feather name="chevron-left" size={18} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Text style={[styles.weekRange, { color: C.text }]}>{rangeLabel}</Text>
          <Pressable
            onPress={() => setAnchorDate(todayISO())}
            style={({ pressed }) => [styles.todayChip, pressed && { opacity: 0.85 }]}
          >
            <Feather name="calendar" size={11} color="#fff" />
            <Text style={styles.todayChipText}>Today</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setAnchorDate(addDaysISO(weekStart, 7))}
          hitSlop={10}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: C.bg },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Feather name="chevron-right" size={18} color={C.text} />
        </Pressable>
      </View>

      {!classId || !sectionId ? (
        <EmptyState icon="calendar" text="Pick a class and section to see the week." C={C} />
      ) : isLoading ? (
        <LoadingState />
      ) : students.length === 0 ? (
        <EmptyState icon="inbox" text="No students enrolled in this section." C={C} />
      ) : (
        <>
          <View
            style={[
              styles.dayHeader,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            {dates.map((d) => {
              const isToday = d === todayKey;
              return (
                <View
                  key={d}
                  style={[
                    styles.dayHeaderCell,
                    isToday && { backgroundColor: COLORS.brand + '22', borderRadius: 10 },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayShort,
                      { color: isToday ? COLORS.brand : C.muted },
                    ]}
                  >
                    {fmtDayShort(d)}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      { color: isToday ? COLORS.brand : C.text },
                    ]}
                  >
                    {fmtDayNum(d)}
                  </Text>
                </View>
              );
            })}
          </View>

          {students.map((s) => {
            const initial = (s.name?.[0] || '?').toUpperCase();
            return (
              <View
                key={s.studentId}
                style={[styles.row, { backgroundColor: C.card, borderColor: C.border }]}
              >
                <View style={styles.rowTop}>
                  {s.photo ? (
                    <Image source={{ uri: s.photo }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[styles.meta, { color: C.mutedSoft }]}>
                      Roll {s.rollNumber || '—'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.dayStripWrap, { borderTopColor: C.border }]}>
                  {dates.map((d) => {
                    const st = statusMap[s.studentId]?.[d];
                    const c = st
                      ? STATUS_PILL[st]
                      : { bg: C.bg, fg: C.mutedSoft, solid: C.border, icon: 'minus' };
                    return (
                      <View key={d} style={styles.dayCell}>
                        <View
                          style={[
                            styles.dayPill,
                            {
                              backgroundColor: st ? c.bg : C.bg,
                              borderColor: st ? c.solid : C.border,
                            },
                          ]}
                        >
                          <Feather
                            name={c.icon}
                            size={12}
                            color={st ? c.fg : C.mutedSoft}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}

          <View style={[styles.legend, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.legendLabel, { color: C.muted }]}>LEGEND</Text>
            <View style={styles.legendRow}>
              {['present', 'absent', 'late', 'half-day', 'leave', 'holiday'].map((k) => {
                const c = STATUS_PILL[k];
                return (
                  <View key={k} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: c.bg, borderColor: c.solid },
                      ]}
                    >
                      <Feather name={c.icon} size={10} color={c.fg} />
                    </View>
                    <Text style={[styles.legendItemLabel, { color: C.text }]}>
                      {c.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function fmtRange(dateISO) {
  const d = new Date(dateISO);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function EmptyState({ icon, text, C }) {
  return (
    <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
      <Feather name={icon} size={32} color={C.mutedSoft} />
      <Text style={[styles.emptyText, { color: C.muted }]}>{text}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator size="large" color={COLORS.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRange: { fontSize: 14, fontWeight: '800' },
  todayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
  },
  todayChipText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  dayHeader: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  dayShort: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dayNum: { fontSize: 13, fontWeight: '800' },

  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  row: { borderRadius: 16, padding: 12, gap: 10, borderWidth: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarImg: { width: 36, height: 36, borderRadius: 999 },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800' },
  name: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 11, marginTop: 2 },

  dayStripWrap: {
    flexDirection: 'row',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  dayCell: { flex: 1, alignItems: 'center' },
  dayPill: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  legend: { borderRadius: 14, padding: 12, gap: 8, borderWidth: 1 },
  legendLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: {
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  legendItemLabel: { fontSize: 11, fontWeight: '600' },
});
