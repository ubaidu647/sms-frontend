import { useState } from 'react';
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
import { useConflicts } from '../../hooks/useTimetable';
import { DAY_LABELS, currentAcademicYear } from '../../constants/timetable';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

export default function ConflictsPanel() {
  const C = useColors();
  const { user } = useUserStore();

  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || !!user?.role?.actions?.includes('view-all-branch-timetable');

  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState('');

  const { data: branchData } = useBranchesDropdown({ enabled: isOrgLevel });
  const branches = branchData?.data || [];

  const { data: conflictRes, isFetching } = useConflicts({
    academicYear,
    branchId: isOrgLevel ? branchId || undefined : undefined,
    enabled: !!academicYear,
  });
  const total = conflictRes?.data?.total || 0;
  const conflicts = conflictRes?.data?.conflicts || [];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
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

        {isOrgLevel && branches.length > 0 && (
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
      </View>

      {isFetching && conflicts.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : total === 0 ? (
        <View
          style={[
            styles.successCard,
            { backgroundColor: '#dcfce7', borderColor: '#86efac' },
          ]}
        >
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={28} color="#fff" />
          </View>
          <Text style={styles.successTitle}>No conflicts</Text>
          <Text style={styles.successText}>
            All teacher schedules are clean for {academicYear}.
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[styles.alertCard, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}
          >
            <View style={styles.alertIcon}>
              <Feather name="alert-triangle" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertCount}>
                {total} conflict{total === 1 ? '' : 's'} detected
              </Text>
              <Text style={styles.alertSub}>
                One or more teachers are double-booked for {academicYear}.
              </Text>
            </View>
          </View>

          {conflicts.map((c, idx) => (
            <View
              key={idx}
              style={[styles.conflict, { backgroundColor: C.card, borderColor: C.border }]}
            >
              <View style={styles.conflictHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.conflictName, { color: C.text }]} numberOfLines={1}>
                    {c.staff?.user?.name || c.staffId || 'Unknown teacher'}
                  </Text>
                  <Text style={[styles.conflictMeta, { color: C.muted }]} numberOfLines={1}>
                    {DAY_LABELS[c.day] || c.day} · period {c.periodNumber}
                  </Text>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                {(c.slots || []).map((s) => (
                  <View
                    key={s._id}
                    style={[styles.slotChip, { borderColor: '#fecaca', backgroundColor: '#fef2f2' }]}
                  >
                    <Feather name="alert-circle" size={11} color="#991b1b" />
                    <Text style={[styles.slotChipText, { color: '#991b1b' }]} numberOfLines={1}>
                      {s.class?.name || ''}
                      {s.section?.name ? ` - ${s.section.name}` : ''}
                      {'  ·  '}
                      {s.subject?.name || s.customLabel || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 32, gap: 12 },

  card: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 10 },
  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700', marginBottom: 4 },
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
  },
  chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  empty: {
    borderRadius: 14,
    paddingVertical: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
  },

  successCard: {
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: { color: '#166534', fontSize: 16, fontWeight: '800' },
  successText: { color: '#166534', fontSize: 13, textAlign: 'center' },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCount: { color: '#991b1b', fontWeight: '800', fontSize: 15 },
  alertSub: { color: '#991b1b', fontSize: 12, marginTop: 2 },

  conflict: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 8 },
  conflictHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  conflictName: { fontSize: 14, fontWeight: '800' },
  conflictMeta: { fontSize: 11, marginTop: 2 },

  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  slotChipText: { fontSize: 12, fontWeight: '700', flex: 1 },
});
