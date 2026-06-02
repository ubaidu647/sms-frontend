import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Sparkline from './Sparkline';

const STATS = [
  { label: 'Fees', value: '9/59', icon: 'credit-card' },
  { label: 'Leads', value: '2/10', icon: 'target' },
  { label: 'Staff', value: '0/8', icon: 'users' },
  { label: 'Students', value: '15/58', icon: 'user' },
];

export default function GeneralView2() {
  return (
    <LinearGradient
      colors={['#312e81', '#1e1b4b', '#831843']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>✦ Aurora</Text>
      </View>
      <Text style={styles.heading}>Good morning.</Text>
      <Text style={styles.sub}>
        58 students, 8 staff, 12 classes — a quiet Wednesday in progress.
      </Text>

      <View style={styles.statGrid}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statTile}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.statLabel}>{s.label}</Text>
              <Feather name={s.icon} size={14} color="rgba(255,255,255,0.7)" />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Wave · Last 7 days</Text>
        <Text style={styles.cardTitle}>Attendance Aurora</Text>
        <Sparkline
          data={[40, 55, 50, 62, 68, 72, 26]}
          stroke="#a855f7"
          fill="rgba(168,85,247,0.22)"
          height={110}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Calm Notes</Text>
        <Text style={styles.cardTitle}>Today</Text>
        <NoteRow icon="star" color="#fbbf24" text="Class 5 leading at 85%" />
        <NoteRow icon="heart" color="#fb7185" text="2 new admissions" />
        <NoteRow icon="clock" color="#60a5fa" text="9 fee vouchers due" />
      </View>
    </LinearGradient>
  );
}

function NoteRow({ icon, color, text }) {
  return (
    <View style={styles.noteRow}>
      <Feather name={icon} size={14} color={color} />
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 18, padding: 18, gap: 12 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heading: { color: '#fff', fontSize: 32, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 6 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 14,
    padding: 14,
  },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '800' },

  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    gap: 6,
  },
  cardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  cardTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  noteText: { color: 'rgba(255,255,255,0.92)', fontSize: 13 },
});
