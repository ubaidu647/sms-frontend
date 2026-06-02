import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLASS_1 } from './data';

const CARDS = (cls) => [
  { color: '#3b82f6', value: cls.students, label: 'students — enrolled', icon: 'users', rotate: '-3deg', day: 132 },
  { color: '#10b981', value: cls.present, label: 'present today', icon: 'check-circle', rotate: '2deg', day: 207 },
  { color: '#f59e0b', value: `${cls.avgMarks}%`, label: 'class average', icon: 'award', rotate: '-2deg', day: 99 },
  { color: '#f43f5e', value: cls.feesPending, label: 'fees pending', icon: 'credit-card', rotate: '3deg', day: 41 },
];

export default function ClassView4() {
  return (
    <View style={{ gap: 18 }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.kicker}>THE CLASS ALBUM</Text>
        <Text style={styles.title}>{CLASS_1.name} — moments & numbers</Text>
      </View>

      <View style={styles.grid}>
        {CARDS(CLASS_1).map((c) => (
          <View
            key={c.label}
            style={[styles.polaroid, { transform: [{ rotate: c.rotate }] }]}
          >
            <View style={styles.tape} />
            <View style={[styles.photo, { backgroundColor: c.color + '20' }]}>
              <Feather name={c.icon} size={34} color={c.color} />
              <Text style={styles.day}>{c.day}/365</Text>
            </View>
            <Text style={styles.value}>{c.value}</Text>
            <Text style={styles.label}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, color: '#6b7280', letterSpacing: 2, fontWeight: '800' },
  title: { fontSize: 20, fontStyle: 'italic', fontWeight: '800', color: '#111827', marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  polaroid: {
    width: '45%',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  tape: {
    position: 'absolute',
    top: -6,
    left: 18,
    width: 40,
    height: 14,
    backgroundColor: 'rgba(252,211,77,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.5)',
  },
  photo: {
    height: 110,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  day: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 9,
    color: '#6b7280',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  value: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center', marginTop: 10 },
  label: { fontSize: 12, fontStyle: 'italic', color: '#6b7280', textAlign: 'center', marginTop: 2 },
});
