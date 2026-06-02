import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const DAY_ROWS = [
  { label: 'Students Present', value: '15/58', icon: 'user-check' },
  { label: 'Staff On Duty', value: '0/8', icon: 'briefcase' },
  { label: 'Open Classes', value: '6', icon: 'book-open' },
];

const NIGHT_ROWS = [
  { label: 'Fees Awaiting', value: '9/59', icon: 'credit-card', color: '#f472b6' },
  { label: 'Leads to Follow', value: '8/10', icon: 'target', color: '#a78bfa' },
  { label: 'Reports Due', value: '3', icon: 'file-text', color: '#22d3ee' },
];

// Pre-computed star positions for night sky
const STARS = Array.from({ length: 22 }, (_, i) => ({
  top: (i * 47) % 100,
  left: (i * 83) % 100,
  size: (i % 3) + 1.5,
  opacity: 0.4 + ((i * 13) % 50) / 100,
}));

export default function GeneralView7() {
  return (
    <View style={{ gap: 14 }}>
      <LinearGradient
        colors={['#fde68a', '#fdba74', '#fbcfe8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.day}
      >
        <View style={styles.sun} />
        <Text style={styles.badgeDay}>☀ DAYLIGHT</Text>
        <Text style={styles.dayTitle}>Live Numbers</Text>
        <Text style={styles.daySub}>What's happening right now in the school.</Text>

        <View style={{ gap: 10, marginTop: 14 }}>
          {DAY_ROWS.map((r) => (
            <View key={r.label} style={styles.dayRow}>
              <View style={styles.dayIcon}>
                <Feather name={r.icon} size={16} color="#44403c" />
              </View>
              <Text style={styles.dayLabel}>{r.label}</Text>
              <Text style={styles.dayVal}>{r.value}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['#1e1b4b', '#0f172a', '#581c87']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.night}
      >
        {STARS.map((s, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
              },
            ]}
          />
        ))}
        <Text style={styles.badgeNight}>🔖 EVENING BRIEF</Text>
        <Text style={styles.nightTitle}>Recap & Pending</Text>
        <Text style={styles.nightSub}>What to wrap up before tomorrow.</Text>

        <View style={{ gap: 10, marginTop: 14 }}>
          {NIGHT_ROWS.map((r) => (
            <View key={r.label} style={styles.nightRow}>
              <View style={[styles.nightIcon, { backgroundColor: r.color + '33' }]}>
                <Feather name={r.icon} size={16} color={r.color} />
              </View>
              <Text style={styles.nightLabel}>{r.label}</Text>
              <Text style={[styles.nightVal, { color: r.color }]}>{r.value}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  day: { borderRadius: 18, padding: 18, overflow: 'hidden', position: 'relative' },
  sun: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: '#fde047',
    shadowColor: '#fde047',
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  badgeDay: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#92400e',
    backgroundColor: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dayTitle: { fontSize: 28, fontWeight: '800', color: '#1c1917', marginTop: 10 },
  daySub: { fontSize: 13, color: '#44403c', marginTop: 4 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    padding: 10,
  },
  dayIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { flex: 1, fontSize: 13, color: '#44403c', fontWeight: '600' },
  dayVal: { fontSize: 18, fontWeight: '800', color: '#1c1917' },

  night: { borderRadius: 18, padding: 18, overflow: 'hidden', position: 'relative' },
  star: { position: 'absolute', backgroundColor: '#fff', borderRadius: 999 },
  badgeNight: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#c7d2fe',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  nightTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 10 },
  nightSub: { fontSize: 13, color: '#c7d2fe', marginTop: 4 },
  nightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  nightIcon: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nightLabel: { flex: 1, fontSize: 13, color: '#e0e7ff', fontWeight: '600' },
  nightVal: { fontSize: 18, fontWeight: '800' },
});
