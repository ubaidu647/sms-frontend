import { StyleSheet, Text, View } from 'react-native';
import { CLASS_1 } from './data';
import { useColors, useIsDark } from '../../theme/useColors';

const ELEMENTS = (cls) => [
  { sym: 'St', value: cls.students, label: 'Students', color: '#3b82f6' },
  { sym: 'Pr', value: cls.present, label: 'Present', color: '#10b981' },
  { sym: 'Mk', value: `${cls.avgMarks}%`, label: 'Avg Marks', color: '#f59e0b' },
  { sym: 'Fe', value: cls.feesPending, label: 'Fees Due', color: '#f43f5e' },
  { sym: 'Cl', value: 6, label: 'Classes', color: '#8b5cf6' },
  { sym: 'Pe', value: 8, label: 'Periods', color: '#06b6d4' },
  { sym: 'Tc', value: 4, label: 'Teachers', color: '#ec4899' },
  { sym: 'Hw', value: 3, label: 'Homework', color: '#6366f1' },
];

export default function ClassView3() {
  const C = useColors();
  const isDark = useIsDark();
  return (
    <View style={[styles.container, { backgroundColor: C.card }]}>
      <Text style={[styles.kicker, { color: C.muted }]}>CLASSROOM ELEMENTS</Text>
      <Text style={[styles.title, { color: C.text }]}>{CLASS_1.name}</Text>
      <Text style={[styles.sub, { color: C.mutedSoft }]}>Eight building blocks of a healthy classroom.</Text>

      <View style={styles.grid}>
        {ELEMENTS(CLASS_1).map((e) => (
          <View
            key={e.sym}
            style={[
              styles.element,
              { backgroundColor: C.card, borderColor: isDark ? C.border : '#111827' },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: e.color }]} />
            <Text style={[styles.symbol, { color: C.text }]}>{e.sym}</Text>
            <Text style={[styles.value, { color: C.text }]}>{e.value}</Text>
            <Text style={[styles.label, { color: C.muted }]}>{e.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 6, alignItems: 'center' },
  kicker: { fontSize: 10, color: '#6b7280', letterSpacing: 2, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 4 },
  sub: { fontSize: 12, color: '#9ca3af', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  element: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#111827',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.9,
    shadowRadius: 0,
    shadowOffset: { width: 4, height: 4 },
    elevation: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 999, alignSelf: 'flex-end', marginBottom: 4 },
  symbol: { fontSize: 36, fontWeight: '800', color: '#111827', textAlign: 'center' },
  value: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 4 },
  label: { fontSize: 9, color: '#6b7280', letterSpacing: 1.2, fontWeight: '700', textAlign: 'center', marginTop: 2 },
});
