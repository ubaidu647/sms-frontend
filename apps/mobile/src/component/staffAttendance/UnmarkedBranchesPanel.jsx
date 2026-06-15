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
import { useUnmarkedStaffBranches } from '../../hooks/useStaffAttendance';
import { todayISO } from '../../constants/staffAttendance';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

export default function UnmarkedBranchesPanel() {
  const C = useColors();
  const [date, setDate] = useState(todayISO());

  const { data, isFetching } = useUnmarkedStaffBranches({ date });

  const branches = data?.data?.branches || [];
  const count = data?.data?.count ?? 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.label, { color: C.muted }]}>DATE (YYYY-MM-DD)</Text>
        <View style={[styles.fieldRow, { backgroundColor: C.bg, borderColor: C.border }]}>
          <Feather name="calendar" size={14} color={COLORS.brand} />
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="2026-06-01"
            placeholderTextColor={C.mutedSoft}
            style={[styles.fieldInput, { color: C.text }]}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {isFetching && (
        <View style={[styles.empty, { backgroundColor: C.card, borderColor: C.border }]}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      )}

      {!isFetching && count === 0 && (
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
            Every branch has marked staff attendance for {date}.
          </Text>
        </View>
      )}

      {!isFetching && count > 0 && (
        <>
          <View
            style={[
              styles.alertCard,
              { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
            ]}
          >
            <View style={styles.alertIcon}>
              <Feather name="alert-triangle" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertCount}>
                {count} branch{count > 1 ? 'es' : ''}
              </Text>
              <Text style={styles.alertSub}>
                haven't marked staff attendance for {date}
              </Text>
            </View>
          </View>

          {branches.map((b) => (
            <View
              key={b.branchId}
              style={[styles.row, { backgroundColor: C.card, borderColor: C.border }]}
            >
              <View style={styles.rowIcon}>
                <Feather name="briefcase" size={16} color={COLORS.brand} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.rowName, { color: C.text }]} numberOfLines={1}>
                  {b.branchName || 'Unnamed branch'}
                </Text>
                <Text style={[styles.rowMeta, { color: C.muted }]} numberOfLines={1}>
                  {b.branchCode || '—'} · {b.staffCount ?? 0} active staff
                </Text>
              </View>
              <View style={styles.staffPill}>
                <Text style={styles.staffPillText}>{b.staffCount ?? 0}</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 32, gap: 10 },
  card: { borderRadius: 14, padding: 12, borderWidth: 1, gap: 8 },
  label: { fontSize: 11, letterSpacing: 1.1, fontWeight: '700' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  fieldInput: { flex: 1, fontSize: 14, fontWeight: '600' },

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
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCount: { color: '#92400e', fontWeight: '800', fontSize: 15 },
  alertSub: { color: '#92400e', fontSize: 12, marginTop: 2 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.brand + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { fontSize: 14, fontWeight: '700' },
  rowMeta: { fontSize: 11, marginTop: 2 },
  staffPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
  },
  staffPillText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
