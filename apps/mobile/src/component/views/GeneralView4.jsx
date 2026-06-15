import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../theme/useColors';

const CARDS = [
  { label: 'Students', value: '58', sub: 'enrolled', icon: 'users', colors: ['#fb923c', '#ec4899'] },
  { label: 'Present', value: '15', sub: 'today', icon: 'check-circle', colors: ['#34d399', '#14b8a6'] },
  { label: 'Fees Due', value: '9', sub: 'vouchers', icon: 'credit-card', colors: ['#fbbf24', '#fb923c'] },
  { label: 'Leads', value: '2', sub: 'converted', icon: 'target', colors: ['#38bdf8', '#8b5cf6'] },
];

const BARS = [68, 72, 70, 78, 85, 60, 26];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function GeneralView4() {
  const C = useColors();
  return (
    <View style={styles.outer}>
      <View style={[styles.header, { backgroundColor: C.card }]}>
        <Text style={styles.badge}>☀ SUNNY DAY</Text>
        <Text style={[styles.title, { color: C.text }]}>Hello, beautiful day!</Text>
        <Text style={[styles.sub, { color: C.muted }]}>
          A bright look at how today is going across the school.
        </Text>
      </View>

      <View style={styles.grid}>
        {CARDS.map((c) => (
          <LinearGradient
            key={c.label}
            colors={c.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <View style={styles.iconCircle}>
              <Feather name={c.icon} size={16} color="#fff" />
            </View>
            <Text style={styles.cardLabel}>{c.label.toUpperCase()}</Text>
            <Text style={styles.cardValue}>{c.value}</Text>
            <Text style={styles.cardSub}>{c.sub}</Text>
          </LinearGradient>
        ))}
      </View>

      <View style={[styles.barCard, { backgroundColor: C.card }]}>
        <Text style={styles.barCardLabel}>MOOD · LAST 7 DAYS</Text>
        <Text style={[styles.barCardTitle, { color: C.text }]}>Attendance Rhythm</Text>
        <View style={styles.bars}>
          {BARS.map((v, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={['#f472b6', '#fb923c', '#fde047']}
                  style={[styles.barFill, { height: `${v}%` }]}
                />
              </View>
              <Text style={styles.barDay}>{DAYS[i]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { gap: 14 },
  header: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  badge: { fontSize: 10, color: '#db2777', fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#1f2937', marginTop: 6 },
  sub: { fontSize: 13, color: '#6b7280', marginTop: 4 },

  grid: { gap: 12 },
  card: {
    borderRadius: 22,
    padding: 18,
    gap: 4,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  cardValue: { color: '#fff', fontSize: 40, fontWeight: '800', lineHeight: 44 },
  cardSub: { color: 'rgba(255,255,255,0.85)', fontSize: 11 },

  barCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  barCardLabel: { fontSize: 10, color: '#db2777', letterSpacing: 2, fontWeight: '800' },
  barCardTitle: { fontSize: 18, fontWeight: '800', color: '#1f2937', marginTop: 6, marginBottom: 12 },
  bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: {
    width: '100%',
    height: 110,
    backgroundColor: '#fce7f3',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 8 },
  barDay: { fontSize: 10, color: '#6b7280', fontWeight: '700' },
});
