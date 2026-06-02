import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { CLASS_1 } from './data';

const ORBIT = 130;
const NODE = 78;

const NODES = (cls) => [
  { angle: -90, label: 'Students', value: cls.students, icon: 'users', color: '#3b82f6' },
  { angle: -30, label: 'Present', value: cls.present, icon: 'check', color: '#10b981' },
  { angle: 30, label: 'Avg Marks', value: `${cls.avgMarks}%`, icon: 'award', color: '#f59e0b' },
  { angle: 90, label: 'Fees Due', value: cls.feesPending, icon: 'credit-card', color: '#ef4444' },
  { angle: 150, label: 'Subjects', value: 6, icon: 'book', color: '#a855f7' },
  { angle: 210, label: 'Teachers', value: 4, icon: 'user', color: '#06b6d4' },
];

export default function ClassView6() {
  const cls = CLASS_1;
  const pct = Math.round((cls.present / cls.students) * 100);
  return (
    <LinearGradient
      colors={['#0f172a', '#312e81', '#581c87']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.kicker}>CLASS SPOTLIGHT</Text>
      <Text style={styles.title}>{cls.name}</Text>

      <View style={styles.orbitBox}>
        <View style={styles.orbitRing} />
        <View style={[styles.orbitRing, { width: ORBIT * 2 + 8, height: ORBIT * 2 + 8, top: -4, left: -4 }]} />

        <LinearGradient
          colors={['#d946ef', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hub}
        >
          <Text style={styles.hubKicker}>ATTENDANCE</Text>
          <Text style={styles.hubValue}>{pct}%</Text>
          <Text style={styles.hubSub}>today</Text>
        </LinearGradient>

        {NODES(cls).map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const cx = ORBIT * Math.cos(rad);
          const cy = ORBIT * Math.sin(rad);
          return (
            <View
              key={n.label}
              style={[
                styles.node,
                {
                  transform: [
                    { translateX: cx - NODE / 2 },
                    { translateY: cy - NODE / 2 },
                  ],
                  shadowColor: n.color,
                },
              ]}
            >
              <Feather name={n.icon} size={16} color={n.color} />
              <Text style={styles.nodeValue}>{n.value}</Text>
              <Text style={styles.nodeLabel} numberOfLines={1}>{n.label}</Text>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 18, padding: 18, alignItems: 'center', gap: 8 },
  kicker: { fontSize: 11, color: '#c7d2fe', letterSpacing: 2, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '800', color: '#fff' },

  orbitBox: {
    width: (ORBIT + NODE / 2) * 2,
    height: (ORBIT + NODE / 2) * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    width: ORBIT * 2,
    height: ORBIT * 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
  },
  hub: {
    width: 132,
    height: 132,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d946ef',
    shadowOpacity: 0.7,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  hubKicker: { fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5, fontWeight: '700' },
  hubValue: { fontSize: 36, color: '#fff', fontWeight: '800' },
  hubSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },

  node: {
    position: 'absolute',
    width: NODE,
    height: NODE,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  nodeValue: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },
  nodeLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '700' },
});
