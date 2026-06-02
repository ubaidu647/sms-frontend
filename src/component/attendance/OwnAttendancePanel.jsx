import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStudentHistory } from '../../hooks/useAttendance';
import { useUserStore } from '../../store/userStore';
import { STATUS_PILL, fmtDate, todayISO, addDaysISO } from '../../constants/attendance';
import { useColors } from '../../theme/useColors';
import { COLORS } from '../../theme/colors';

export default function OwnAttendancePanel() {
  const C = useColors();
  const { user } = useUserStore();
  const studentId = user?.studentId;

  const [from, setFrom] = useState(addDaysISO(todayISO(), -30));
  const [to, setTo] = useState(todayISO());

  const { data, isLoading, error } = useStudentHistory({
    studentId,
    from,
    to,
    enabled: !!studentId,
  });

  const records = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : data?.data || [];
  }, [data]);

  // Tally per status
  const tally = useMemo(() => {
    const t = {};
    for (const r of records) {
      const k = r.status || 'unmarked';
      t[k] = (t[k] || 0) + 1;
    }
    return t;
  }, [records]);

  if (!studentId) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Feather name="user-x" size={36} color={COLORS.red} />
        <Text style={[styles.title, { color: C.text }]}>Not linked</Text>
        <Text style={[styles.sub, { color: C.muted, textAlign: 'center' }]}>
          Your account isn't linked to a student record. Ask the school to link
          your account.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
    >
      <View>
        <Text style={[styles.title, { color: C.text }]}>My Attendance</Text>
        <Text style={[styles.sub, { color: C.muted }]}>
          View your attendance history for any date range.
        </Text>
      </View>

      <View
        style={[styles.filterCard, { backgroundColor: C.card, borderColor: C.border }]}
      >
        <View style={{ gap: 6, flex: 1 }}>
          <Text style={[styles.label, { color: C.muted }]}>FROM</Text>
          <TextInput
            value={from}
            onChangeText={setFrom}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.mutedSoft}
            style={[
              styles.input,
              { color: C.text, backgroundColor: C.bg, borderColor: C.border },
            ]}
          />
        </View>
        <View style={{ gap: 6, flex: 1 }}>
          <Text style={[styles.label, { color: C.muted }]}>TO</Text>
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.mutedSoft}
            style={[
              styles.input,
              { color: C.text, backgroundColor: C.bg, borderColor: C.border },
            ]}
          />
        </View>
      </View>

      {records.length > 0 && (
        <View
          style={[
            styles.tallyCard,
            { backgroundColor: C.card, borderColor: C.border },
          ]}
        >
          {Object.entries(tally).map(([k, v]) => {
            const c = STATUS_PILL[k] || { bg: C.border, fg: C.text, label: k };
            return (
              <View key={k} style={styles.tallyItem}>
                <Text style={[styles.tallyValue, { color: c.fg }]}>{v}</Text>
                <Text style={[styles.tallyLabel, { color: C.muted }]}>
                  {c.label || k}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Feather name="alert-circle" size={32} color={COLORS.red} />
          <Text style={[styles.emptyText, { color: C.muted }]}>
            {error?.response?.data?.message || error?.message || 'Could not load'}
          </Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="inbox" size={32} color={C.mutedSoft} />
          <Text style={[styles.emptyText, { color: C.muted }]}>
            No attendance records in this range.
          </Text>
        </View>
      ) : (
        records.map((r) => {
          const c = STATUS_PILL[r.status] || { bg: C.border, fg: C.text, label: r.status || '—' };
          return (
            <View
              key={r._id || r.date}
              style={[
                styles.row,
                { backgroundColor: C.card, borderColor: C.border },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.date, { color: C.text }]}>{fmtDate(r.date)}</Text>
                {!!(r.reason || r.notes) && (
                  <Text style={[styles.note, { color: C.muted }]} numberOfLines={2}>
                    {r.reason || r.notes}
                  </Text>
                )}
              </View>
              <View style={[styles.pill, { backgroundColor: c.bg }]}>
                <Text style={[styles.pillText, { color: c.fg }]}>{c.label}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 4 },

  filterCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },

  tallyCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  tallyItem: { alignItems: 'center', minWidth: 50 },
  tallyValue: { fontSize: 22, fontWeight: '800' },
  tallyLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  empty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 13, textAlign: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  date: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 12, marginTop: 2 },

  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
});
