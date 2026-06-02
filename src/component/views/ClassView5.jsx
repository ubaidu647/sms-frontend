import { StyleSheet, Text, View } from 'react-native';
import { CLASS_1 } from './data';

export default function ClassView5() {
  const cls = CLASS_1;
  const pct = Math.round((cls.present / cls.students) * 100);
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
        <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
        <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
        <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />

        <Text style={styles.kicker}>✦ KIRAN MODEL SCHOOL ✦</Text>
        <Text style={styles.title}>Class Summary</Text>
        <Text style={styles.preface}>Awarded with pride to</Text>
        <Text style={styles.className}>{cls.name}</Text>

        <Text style={styles.body}>
          In recognition of consistent effort, an attendance rate of{' '}
          <Text style={styles.bodyBold}>{pct}%</Text>, and an academic average of{' '}
          <Text style={styles.bodyBold}>{cls.avgMarks}%</Text> this term. May this
          momentum continue.
        </Text>

        <View style={styles.statsGrid}>
          <StatBox label="STUDENTS" value={cls.students} />
          <StatBox label="PRESENT" value={`${pct}%`} />
          <StatBox label="AVG MARKS" value={`${cls.avgMarks}%`} />
          <StatBox label="FEES DUE" value={cls.feesPending} />
        </View>
      </View>
    </View>
  );
}

function StatBox({ label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: 6, borderColor: '#b45309', borderRadius: 12, backgroundColor: '#fdfaf2', padding: 6 },
  inner: { padding: 22, alignItems: 'center', gap: 8, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#d97706', borderRadius: 4 },

  kicker: { fontSize: 11, color: '#b45309', letterSpacing: 3, fontWeight: '800' },
  title: { fontSize: 36, fontWeight: '800', color: '#1c1917', fontStyle: 'italic', marginTop: 8 },
  preface: { fontSize: 13, fontStyle: 'italic', color: '#78716c' },
  className: { fontSize: 26, fontStyle: 'italic', fontWeight: '800', color: '#b45309' },
  body: { fontSize: 13, lineHeight: 22, color: '#44403c', textAlign: 'center', fontStyle: 'italic', marginTop: 12, paddingHorizontal: 8 },
  bodyBold: { fontWeight: '800', color: '#1c1917' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 16, width: '100%' },
  statBox: { flexBasis: '50%', alignItems: 'center', paddingVertical: 10 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#92400e' },
  statLabel: { fontSize: 10, color: '#78716c', letterSpacing: 2, marginTop: 2 },
});
