import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 72;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export default function StatCard({ title, value, percent, trend, bg }) {
  const offset = CIRC - (percent / 100) * CIRC;
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        <View style={styles.trendRow}>
          <View style={styles.trendIcon}>
            <Feather name="trending-up" size={11} color="#fff" />
          </View>
          <Text style={styles.trendText}>{trend}</Text>
        </View>
      </View>

      <View style={styles.ring}>
        <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#fff"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={offset}
            fill="none"
          />
        </Svg>
        <Text style={styles.ringText}>+{percent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: { color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '600' },
  value: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 32 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  trendIcon: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: { color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '600' },
  ring: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: {
    position: 'absolute',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
