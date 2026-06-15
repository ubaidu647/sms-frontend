import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CLASS_1 } from './data';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const BARS = [60, 70, 80, 85, 92, 0, 0];

export default function ClassView2() {
  const cls = CLASS_1;
  const pct = Math.round((cls.present / cls.students) * 100);

  return (
    <LinearGradient
      colors={['#000', '#0f172a', '#022c22']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <Text style={styles.kicker}>— LIVE BOARD —</Text>
        <Text style={styles.shift}>SHIFT · <Text style={styles.shiftVal}>MORNING</Text></Text>
      </View>
      <Text style={styles.classTitle}>{cls.name.toUpperCase()}</Text>

      <View style={styles.divider} />

      <View style={styles.statGrid}>
        <StatCell label="STUDENTS" value={String(cls.students).padStart(3, '0')} color="#fff" />
        <StatCell label="PRESENT" value={String(cls.present).padStart(3, '0')} color="#6ee7b7" />
        <StatCell label="MARKS AVG" value={`${cls.avgMarks}%`} color="#fcd34d" />
        <StatCell label="DUE" value={String(cls.feesPending).padStart(3, '0')} color="#f87171" />
      </View>

      <View style={styles.attCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.attLabel}>ATTENDANCE %</Text>
          <Text style={[styles.attValue, { textShadowColor: '#10b981' }]}>{pct}%</Text>
        </View>
        <View style={styles.attBars}>
          {BARS.map((v, i) => (
            <View key={i} style={[styles.attBar, { height: (v / 100) * 50 + 4, backgroundColor: v ? '#10b981' : '#064e3b' }]} />
          ))}
        </View>
      </View>

      <Text style={styles.footer}>● RECORDING · SYS://CLASS-01-A · OK</Text>
    </LinearGradient>
  );
}

function StatCell({ label, value, color }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          {
            color,
            textShadowColor: color,
            textShadowRadius: 12,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(16,185,129,0.4)',
    gap: 10,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontFamily: MONO, fontSize: 10, color: '#34d399', letterSpacing: 2 },
  shift: { fontFamily: MONO, fontSize: 10, color: '#34d399', letterSpacing: 2 },
  shiftVal: { color: '#fcd34d', fontWeight: '800' },
  classTitle: { fontFamily: MONO, fontSize: 20, color: '#fff', fontWeight: '800', letterSpacing: 1 },
  divider: { borderBottomWidth: 2, borderBottomColor: 'rgba(16,185,129,0.35)' },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { flexBasis: '50%', paddingVertical: 12, paddingHorizontal: 4, borderColor: 'rgba(16,185,129,0.25)', borderWidth: StyleSheet.hairlineWidth },
  statLabel: { fontFamily: MONO, fontSize: 10, color: '#34d399', letterSpacing: 1.5 },
  statValue: { fontFamily: MONO, fontSize: 38, fontWeight: '800', marginTop: 6 },

  attCard: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)', gap: 12 },
  attLabel: { fontFamily: MONO, fontSize: 10, color: '#34d399', letterSpacing: 1.5 },
  attValue: { fontFamily: MONO, fontSize: 40, color: '#6ee7b7', fontWeight: '800', textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 } },
  attBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 60 },
  attBar: { width: 8, borderRadius: 2, shadowColor: '#10b981', shadowOpacity: 0.6, shadowRadius: 6 },

  footer: { fontFamily: MONO, fontSize: 10, color: '#34d399', letterSpacing: 1.5, marginTop: 4 },
});
