import { StyleSheet, Text, View } from 'react-native';

const COLUMNS = [
  { tag: 'Page A1', headline: 'Attendance Holds', stat: '15', tail: 'of 58 students present', lede: 'A modest yet steady showing across the morning sessions.' },
  { tag: 'Finance', headline: 'Coffers Half-Filled', stat: '9', tail: 'vouchers awaiting payment', lede: 'A reminder gentle but firm goes to parents on this fine evening.' },
  { tag: 'Admissions', headline: 'Two New Pupils', stat: '+2', tail: 'leads converted today', lede: 'Two families joined the school — both promising young scholars.' },
];

const FOOTER_STATS = [
  { value: '58', label: 'Students' },
  { value: '08', label: 'Staff' },
  { value: '12', label: 'Classes' },
  { value: '03', label: 'Branches' },
];

export default function GeneralView3() {
  return (
    <View style={styles.container}>
      <Text style={styles.dateline}>VOL. I · WEDNESDAY, 16TH MAY 2026 · PRICE: FREE</Text>
      <Text style={styles.masthead}>The School Chronicle</Text>
      <Text style={styles.tagline}>✦ Truth · Discipline · Excellence ✦</Text>

      <View style={styles.thickRule} />
      <Text style={styles.sectionRule}>— All the numbers fit to print —</Text>

      {COLUMNS.map((c, i) => (
        <View key={c.tag} style={[styles.col, i < COLUMNS.length - 1 && styles.colDivide]}>
          <Text style={styles.colTag}>{c.tag.toUpperCase()}</Text>
          <Text style={styles.colHeadline}>{c.headline}</Text>
          <Text style={styles.colStat}>
            {c.stat}
            <Text style={styles.colStatTail}> {c.tail}</Text>
          </Text>
          <Text style={styles.colLede}>{c.lede}</Text>
        </View>
      ))}

      <View style={styles.thickRule} />
      <View style={styles.footerStats}>
        {FOOTER_STATS.map((s, i) => (
          <View key={s.label} style={[styles.footerCell, i < FOOTER_STATS.length - 1 && styles.footerCellDivide]}>
            <Text style={styles.footerValue}>{s.value}</Text>
            <Text style={styles.footerLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fbf6ec',
    borderRadius: 16,
    padding: 22,
    borderWidth: 2,
    borderColor: '#a78757',
    gap: 8,
  },
  dateline: { fontSize: 9, letterSpacing: 3, color: '#78716c', textAlign: 'center' },
  masthead: { fontSize: 36, fontWeight: '800', fontStyle: 'italic', color: '#1c1917', textAlign: 'center', marginTop: 4 },
  tagline: { fontSize: 11, fontStyle: 'italic', color: '#78716c', textAlign: 'center', marginBottom: 8 },
  thickRule: { height: 2, backgroundColor: '#a78757', marginVertical: 6 },
  sectionRule: { fontSize: 11, fontStyle: 'italic', color: '#78716c', textAlign: 'center', marginBottom: 8 },

  col: { paddingVertical: 14 },
  colDivide: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#a78757' },
  colTag: { fontSize: 10, letterSpacing: 2, color: '#b45309', fontWeight: '800' },
  colHeadline: { fontSize: 22, fontStyle: 'italic', fontWeight: '800', color: '#1c1917', marginTop: 2 },
  colStat: { fontSize: 34, fontWeight: '800', color: '#b45309', marginTop: 6 },
  colStatTail: { fontSize: 11, color: '#78716c', fontWeight: '600', fontStyle: 'italic' },
  colLede: { fontSize: 12, fontStyle: 'italic', color: '#57534e', marginTop: 4, lineHeight: 18 },

  footerStats: { flexDirection: 'row', paddingTop: 12 },
  footerCell: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  footerCellDivide: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#a78757' },
  footerValue: { fontSize: 26, fontWeight: '800', color: '#1c1917', fontStyle: 'italic' },
  footerLabel: { fontSize: 10, color: '#78716c', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
});
