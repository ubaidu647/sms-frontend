import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StatCard from '../../src/component/StatCard';
import ViewSwitcher from '../../src/component/ViewSwitcher';
import { useUserStore } from '../../src/store/userStore';
import { COLORS } from '../../src/theme/colors';
import { useColors } from '../../src/theme/useColors';
import { GENERAL_STATS } from '../../src/component/views/data';
import GeneralView2 from '../../src/component/views/GeneralView2';
import GeneralView3 from '../../src/component/views/GeneralView3';
import GeneralView4 from '../../src/component/views/GeneralView4';
import GeneralView5 from '../../src/component/views/GeneralView5';
import GeneralView6 from '../../src/component/views/GeneralView6';
import GeneralView7 from '../../src/component/views/GeneralView7';
import ClassView1 from '../../src/component/views/ClassView1';
import ClassView2 from '../../src/component/views/ClassView2';
import ClassView3 from '../../src/component/views/ClassView3';
import ClassView4 from '../../src/component/views/ClassView4';
import ClassView5 from '../../src/component/views/ClassView5';
import ClassView6 from '../../src/component/views/ClassView6';
import ClassView7 from '../../src/component/views/ClassView7';

const QUICK_LINKS = [
  { label: 'Branches', icon: 'git-branch', path: '/(app)/branches' },
  { label: 'Students', icon: 'user' },
  { label: 'Staff', icon: 'users' },
  { label: 'Attendance', icon: 'check-square' },
];

function GeneralView1() {
  return (
    <View style={{ gap: 12 }}>
      {GENERAL_STATS.map((s) => (
        <StatCard key={s.title} {...s} />
      ))}
    </View>
  );
}

const VIEW_REGISTRY = {
  'general-1': GeneralView1,
  'general-2': GeneralView2,
  'general-3': GeneralView3,
  'general-4': GeneralView4,
  'general-5': GeneralView5,
  'general-6': GeneralView6,
  'general-7': GeneralView7,
  'class-1': ClassView1,
  'class-2': ClassView2,
  'class-3': ClassView3,
  'class-4': ClassView4,
  'class-5': ClassView5,
  'class-6': ClassView6,
  'class-7': ClassView7,
};

export default function Dashboard() {
  const user = useUserStore((s) => s.user);
  const router = useRouter();
  const [view, setView] = useState('general-1');
  const C = useColors();

  const ViewComponent = VIEW_REGISTRY[view] || GeneralView1;

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.welcome, { color: C.text }]}>
          Welcome, {user?.name || 'there'}
        </Text>
        <View style={styles.viewSwitcherWrap}>
          <ViewSwitcher value={view} onChange={setView} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ViewComponent />

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {QUICK_LINKS.map((q) => (
              <Pressable
                key={q.label}
                onPress={() => q.path && router.push(q.path)}
                style={({ pressed }) => [
                  styles.quickTile,
                  { backgroundColor: C.card, borderColor: C.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={styles.quickIcon}>
                  <Feather name={q.icon} size={20} color={COLORS.brand} />
                </View>
                <Text style={[styles.quickLabel, { color: C.text }]}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14,
    gap: 12,
  },
  welcome: { fontSize: 22, fontWeight: '800' },
  viewSwitcherWrap: { alignItems: 'center' },
  scroll: { padding: 18, paddingTop: 4, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickTile: {
    flexBasis: '47.5%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e8f6f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 13, fontWeight: '700' },
});
