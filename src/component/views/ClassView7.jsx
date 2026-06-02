import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Sparkline from './Sparkline';
import { CLASS_1 } from './data';
import { useColors } from '../../theme/useColors';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const TICKERS = [
  { sym: 'STU', val: 58, delta: '▲ +2', up: true },
  { sym: 'PRS', val: 15, delta: '▼ −3', up: false },
  { sym: 'AVG', val: '78%', delta: '▲ +4', up: true },
  { sym: 'FEE', val: 9, delta: '▼ −2', up: false },
  { sym: 'LDS', val: 2, delta: '▲ +1', up: true },
  { sym: 'STF', val: 8, delta: '▲ 0', up: true },
];

const TOP_STUDENTS = [
  { name: 'Ayesha A.', pct: 92, up: true },
  { name: 'Bilal K.', pct: 88, up: true },
  { name: 'Hina S.', pct: 85, up: false },
  { name: 'Usman T.', pct: 80, up: true },
];

const SUBJECTS = [
  { name: 'MATH', val: 82, color: '#3b82f6' },
  { name: 'ENG', val: 76, color: '#10b981' },
  { name: 'SCI', val: 88, color: '#f59e0b' },
  { name: 'URD', val: 71, color: '#ef4444' },
  { name: 'SST', val: 79, color: '#a855f7' },
];

export default function ClassView7() {
  const cls = CLASS_1;
  const C = useColors();
  const pct = Math.round((cls.present / cls.students) * 100);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.ticker}>
        <Text style={styles.tickerHeader}>● LIVE FEED · CLASS 1 — SECTION A · 16/05/26</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerScroll}>
          {TICKERS.map((t, i) => (
            <View key={i} style={styles.tickerCell}>
              <Text style={styles.tickerSym}>{t.sym}</Text>
              <Text style={styles.tickerVal}>{t.val}</Text>
              <Text style={[styles.tickerDelta, { color: t.up ? '#34d399' : '#f87171' }]}>{t.delta}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardKicker, { color: C.muted }]}>INTRADAY · LAST 12 SESSIONS</Text>
            <Text style={[styles.cardTitle, { color: C.text }]}>Performance Tape</Text>
          </View>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <Sparkline
          data={[60, 65, 72, 68, 75, 80, 78, 82, 85, 88, 84, pct]}
          stroke="#10b981"
          fill="rgba(16,185,129,0.18)"
          height={130}
        />
      </View>

      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.cardTitle, { color: C.text }]}>Best Performers</Text>
        {TOP_STUDENTS.map((s, i) => (
          <View
            key={s.name}
            style={[styles.stuRow, i > 0 && [styles.stuRowDivider, { borderTopColor: C.border }]]}
          >
            <Text style={[styles.stuName, { color: C.text }]}>{s.name}</Text>
            <Text style={[styles.stuPct, { color: s.up ? '#10b981' : '#ef4444' }]}>
              {s.pct}% {s.up ? '▲' : '▼'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.subjectGrid}>
        {SUBJECTS.map((s) => (
          <View
            key={s.name}
            style={[
              styles.subject,
              { backgroundColor: C.card, borderColor: C.border, borderLeftColor: s.color },
            ]}
          >
            <Text style={[styles.subjName, { color: C.muted }]}>{s.name}</Text>
            <Text style={[styles.subjVal, { color: C.text }]}>{s.val}</Text>
            <Text style={[styles.subjUnit, { color: C.mutedSoft }]}>avg %</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticker: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)', borderRadius: 12, overflow: 'hidden' },
  tickerHeader: { fontFamily: MONO, color: '#34d399', fontSize: 10, padding: 10, backgroundColor: '#022c22', letterSpacing: 1.5 },
  tickerScroll: { paddingVertical: 12, paddingHorizontal: 4, gap: 16 },
  tickerCell: { paddingHorizontal: 14, borderRightWidth: 1, borderRightColor: 'rgba(16,185,129,0.25)', gap: 2 },
  tickerSym: { fontFamily: MONO, color: '#34d399', fontSize: 10 },
  tickerVal: { fontFamily: MONO, color: '#fff', fontSize: 16, fontWeight: '800' },
  tickerDelta: { fontFamily: MONO, fontSize: 10, fontWeight: '700' },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardKicker: { fontSize: 10, color: '#6b7280', letterSpacing: 1.5, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginTop: 4 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  liveText: { fontFamily: MONO, fontSize: 10, color: '#059669', fontWeight: '800' },

  stuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  stuRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  stuName: { fontSize: 14, color: '#111827', fontWeight: '600' },
  stuPct: { fontSize: 14, fontWeight: '800' },

  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subject: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 2,
  },
  subjName: { fontFamily: MONO, fontSize: 10, color: '#6b7280', fontWeight: '700' },
  subjVal: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subjUnit: { fontSize: 10, color: '#9ca3af' },
});
