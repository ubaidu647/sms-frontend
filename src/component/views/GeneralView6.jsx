import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '../../theme/useColors';

const CARDS = [
  { tag: 'STUDENTS', value: '58', label: 'enrolled', bg: '#fef3c7', stripe: '#f59e0b', icon: 'users', rotate: '-2deg' },
  { tag: 'FEES CLEARED', value: '40', label: 'this month', bg: '#d1fae5', stripe: '#10b981', icon: 'check', rotate: '2deg' },
  { tag: 'ADMISSIONS', value: '+2', label: 'today', bg: '#ffe4e6', stripe: '#f43f5e', icon: 'user-plus', rotate: '-1deg' },
  { tag: 'STAFF', value: '8', label: 'on duty', bg: '#e0f2fe', stripe: '#0ea5e9', icon: 'user-check', rotate: '2deg' },
];

export default function GeneralView6() {
  const C = useColors();
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.header}>
        <Feather name="map-pin" size={16} color="#f43f5e" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerKicker, { color: C.muted }]}>THE SCHOOL PINBOARD</Text>
          <Text style={[styles.headerTitle, { color: C.text }]}>Today's notes & numbers</Text>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        {CARDS.map((c) => (
          <View
            key={c.tag}
            style={[styles.card, { backgroundColor: c.bg, transform: [{ rotate: c.rotate }] }]}
          >
            <View style={[styles.tape, { backgroundColor: c.stripe }]} />
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTag}>{c.tag}</Text>
              <Feather name={c.icon} size={16} color={c.stripe} />
            </View>
            <Text style={styles.cardValue}>{c.value}</Text>
            <Text style={styles.cardLabel}>{c.label}</Text>
            <Text style={styles.cardFooter}>keep going ✨</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  headerKicker: { fontSize: 10, letterSpacing: 2, color: '#6b7280', fontWeight: '800' },
  headerTitle: { fontSize: 22, fontStyle: 'italic', fontWeight: '800', color: '#1f2937', marginTop: 2 },

  card: {
    borderRadius: 16,
    padding: 18,
    paddingTop: 28,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  tape: {
    position: 'absolute',
    top: -6,
    left: 28,
    width: 60,
    height: 14,
    borderRadius: 4,
    opacity: 0.85,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTag: { fontSize: 10, letterSpacing: 2, color: '#374151', fontWeight: '800' },
  cardValue: { fontSize: 38, fontWeight: '800', color: '#1f2937', marginTop: 6 },
  cardLabel: { fontSize: 11, color: '#374151', fontWeight: '600' },
  cardFooter: { fontSize: 13, fontStyle: 'italic', color: '#6b7280', marginTop: 8 },
});
