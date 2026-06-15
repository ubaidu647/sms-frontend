import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CLASS_1 } from './data';

function Card({ title, value, sub, icon, bg }) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={20} color="#fff" />
      </View>
    </View>
  );
}

export default function ClassView1() {
  const cls = CLASS_1;
  const presentPct = Math.round((cls.present / cls.students) * 100);
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Overview — {cls.name}</Text>
        <Text style={styles.headerSub}>Class-specific summary</Text>
      </View>
      <Card title="Total Students" value={String(cls.students)} sub="on roster" icon="users" bg="#2E6BE6" />
      <Card title="Present Today" value={`${cls.present}/${cls.students}`} sub={`${presentPct}% attendance`} icon="check-circle" bg="#2F8F7A" />
      <Card title="Average Marks" value={`${cls.avgMarks}%`} sub="this term" icon="award" bg="#E0A328" />
      <Card title="Fees Pending" value={`${cls.feesPending}/${cls.students}`} sub="vouchers" icon="credit-card" bg="#D94A2A" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1f2937' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  title: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  value: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4 },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
