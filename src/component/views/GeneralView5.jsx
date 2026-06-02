import { Platform, StyleSheet, Text, View } from 'react-native';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const ROWS = [
  { label: 'STUDENTS PRESENT', value: '15', denom: '/58', accent: false },
  { label: 'FEES OUTSTANDING', value: '09', denom: '/59', accent: true },
  { label: 'STAFF ON DUTY', value: '00', denom: '/08', accent: false },
  { label: 'LEADS CONVERTED', value: '02', denom: '/10', accent: false },
];

const BARS = [68, 72, 70, 78, 85, 60, 26];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function GeneralView5() {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLeft}>— DAILY SHEET —</Text>
        <Text style={styles.headerRight}>16 / 05 / 2026</Text>
      </View>
      <Text style={styles.school}>KIRAN MODEL SCHOOL · KARACHI</Text>

      <View style={styles.divider} />

      {ROWS.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={[styles.rowLabel, r.accent && styles.rowAccent]}>{r.label}</Text>
          <View style={styles.rowVal}>
            <Text style={[styles.value, r.accent && styles.valueAccent]}>{r.value}</Text>
            <Text style={[styles.denom, r.accent && styles.rowAccent]}>{r.denom}</Text>
          </View>
        </View>
      ))}

      <View style={styles.divider} />

      <Text style={styles.barTitle}>WEEK BARS</Text>
      <View style={styles.bars}>
        {BARS.map((v, i) => (
          <View key={i} style={styles.barCol}>
            <View style={[styles.bar, { height: (v / 100) * 80 }]} />
            <Text style={styles.barDay}>{DAYS[i]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />
      <Text style={styles.footer}>— END OF SHEET —</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#111',
    padding: 18,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#111' },
  headerRight: { fontFamily: MONO, fontSize: 10, color: '#111' },
  school: { fontFamily: MONO, fontSize: 10, color: '#111', textAlign: 'right', marginTop: 2 },
  divider: { borderTopWidth: 1, borderTopColor: '#111', borderStyle: 'dashed', marginVertical: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 10 },
  rowLabel: { fontFamily: MONO, fontSize: 11, fontWeight: '700', color: '#111', letterSpacing: 1 },
  rowAccent: { color: '#dc2626' },
  rowVal: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontFamily: MONO, fontSize: 44, fontWeight: '800', color: '#111' },
  valueAccent: { color: '#dc2626' },
  denom: { fontFamily: MONO, fontSize: 18, color: '#666', marginLeft: 2 },

  barTitle: { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#111', marginBottom: 4 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90, justifyContent: 'space-between' },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '70%', backgroundColor: '#111' },
  barDay: { fontFamily: MONO, fontSize: 9, color: '#111', marginTop: 4 },

  footer: { fontFamily: MONO, fontSize: 10, color: '#111', textAlign: 'center', letterSpacing: 2 },
});
