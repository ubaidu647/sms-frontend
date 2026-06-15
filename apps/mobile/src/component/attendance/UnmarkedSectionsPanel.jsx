import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUnmarkedSections } from '../../hooks/useAttendance';
import { currentAcademicYear, todayISO, fmtDate } from '../../constants/attendance';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

export default function UnmarkedSectionsPanel() {
  const C = useColors();
  const [date, setDate] = useState(todayISO());
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const { data, isLoading, isFetching } = useUnmarkedSections({
    date,
    academicYear,
  });
  const result = data?.data;
  const sections = result?.sections || [];
  const count = result?.count ?? 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
    >
      <View
        style={[styles.filterCard, { backgroundColor: C.card, borderColor: C.border }]}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[styles.label, { color: C.muted }]}>DATE</Text>
          <View style={styles.fieldRow}>
            <Feather name="calendar" size={14} color={C.muted} />
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.mutedSoft}
              style={[styles.fieldInput, { color: C.text }]}
            />
          </View>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[styles.label, { color: C.muted }]}>ACADEMIC YEAR</Text>
          <View style={styles.fieldRow}>
            <Feather name="book-open" size={14} color={C.muted} />
            <TextInput
              value={academicYear}
              onChangeText={setAcademicYear}
              placeholder="2025-2026"
              placeholderTextColor={C.mutedSoft}
              style={[styles.fieldInput, { color: C.text }]}
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : count === 0 ? (
        <View
          style={[
            styles.successCard,
            { backgroundColor: '#dcfce7', borderColor: '#86efac' },
          ]}
        >
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={28} color="#fff" />
          </View>
          <Text style={styles.successTitle}>All marked!</Text>
          <Text style={styles.successText}>
            Every section has marked attendance for {fmtDate(date)}.
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.alertCard,
              { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
            ]}
          >
            <View style={styles.alertHeader}>
              <View style={styles.alertIcon}>
                <Feather name="alert-circle" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertCount}>
                  {count} {count === 1 ? 'section' : 'sections'}
                </Text>
                <Text style={styles.alertSub}>
                  haven't marked attendance for {fmtDate(date)}
                </Text>
              </View>
              {isFetching && <ActivityIndicator size="small" color="#92400e" />}
            </View>
          </View>

          {sections.map((s) => (
            <View
              key={s.sectionId}
              style={[
                styles.row,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              <View style={styles.rowHeader}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>
                    {(s.class?.grade || '?').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.className, { color: C.text }]} numberOfLines={1}>
                    {s.class?.name || '—'}
                  </Text>
                  <Text style={[styles.classMeta, { color: C.muted }]}>
                    Section {s.sectionName} · {s.academicYear}
                  </Text>
                </View>
                <View style={styles.warnPill}>
                  <Feather name="alert-triangle" size={11} color="#92400e" />
                  <Text style={styles.warnPillText}>Unmarked</Text>
                </View>
              </View>
              <View style={[styles.strengthRow, { borderTopColor: C.border }]}>
                <View style={styles.strengthItem}>
                  <Feather name="users" size={13} color={C.mutedSoft} />
                  <Text style={[styles.strengthLabel, { color: C.muted }]}>
                    Strength
                  </Text>
                </View>
                <Text style={[styles.strengthValue, { color: C.text }]}>
                  {s.currentStrength ?? 0}
                  <Text style={{ color: C.mutedSoft, fontWeight: '600' }}>
                    {' '}/ {s.capacity ?? 0}
                  </Text>
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#e5e7eb',
  },
  fieldInput: { flex: 1, fontSize: 14 },

  emptyState: { alignItems: 'center', paddingVertical: 36 },

  successCard: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: { color: '#166534', fontSize: 18, fontWeight: '800' },
  successText: { color: '#166534', fontSize: 13, textAlign: 'center' },

  alertCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCount: { color: '#92400e', fontSize: 18, fontWeight: '800' },
  alertSub: { color: '#92400e', fontSize: 12, marginTop: 2 },

  row: { borderRadius: 16, padding: 14, gap: 12, borderWidth: 1 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gradeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: { fontSize: 13, fontWeight: '800', color: '#1d4ed8' },
  className: { fontSize: 14, fontWeight: '700' },
  classMeta: { fontSize: 11, marginTop: 2 },

  warnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fef3c7',
  },
  warnPillText: { color: '#92400e', fontSize: 10, fontWeight: '800' },

  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  strengthItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strengthLabel: { fontSize: 12, fontWeight: '700' },
  strengthValue: { fontSize: 16, fontWeight: '800' },
});
