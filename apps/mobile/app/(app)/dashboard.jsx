import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ViewSwitcher from '../../src/component/ViewSwitcher';
import { useUserStore } from '../../src/store/userStore';
import { canSee } from '../../src/utils/permissions';
import { useDashboardStats } from '../../src/hooks/useDashboardStats';
import { COLORS } from '../../src/theme/colors';
import { useColors } from '../../src/theme/useColors';
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
  { label: 'Branches', icon: 'git-branch', path: '/(app)/branches', base: 'view-branch' },
  { label: 'Students', icon: 'user', path: '/(app)/students', base: 'view-student' },
  { label: 'Staff', icon: 'users', path: '/(app)/staff', base: 'view-staff' },
  { label: 'Attendance', icon: 'check-square', path: '/(app)/attendance', base: 'view-attendance' },
];

// Real headline counts (replaces the old hardcoded mock cards). Each tile is
// shown only if the role can see that resource, taps through to its screen, and
// shows a live count from the backend.
const STAT_TILES = [
  { key: 'students', label: 'Students', icon: 'user', bg: COLORS.statBlue, path: '/(app)/students', base: 'view-student' },
  { key: 'staff', label: 'Staff', icon: 'users', bg: COLORS.statTeal, path: '/(app)/staff', base: 'view-staff' },
  { key: 'classes', label: 'Classes', icon: 'layers', bg: COLORS.statAmber, path: '/(app)/classes', base: 'view-class' },
  { key: 'branches', label: 'Branches', icon: 'git-branch', bg: COLORS.statRed, path: '/(app)/branches', base: 'view-branch' },
];

function LiveSummary({ stats, role, onTile }) {
  const tiles = STAT_TILES.filter((t) => canSee(role, t.base));
  if (tiles.length === 0) return null;
  return (
    <View style={styles.statGrid}>
      {tiles.map((t) => {
        const q = stats[t.key];
        return (
          <Pressable
            key={t.key}
            onPress={() => onTile(t.path)}
            style={({ pressed }) => [styles.statTile, { backgroundColor: t.bg }, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.statIcon}>
              <Feather name={t.icon} size={18} color="#fff" />
            </View>
            {q?.isLoading ? (
              <ActivityIndicator color="#fff" style={{ alignSelf: 'flex-start', height: 34 }} />
            ) : (
              <Text style={styles.statValue}>{q?.isError ? '—' : (q?.data ?? 0).toLocaleString()}</Text>
            )}
            <Text style={styles.statLabel}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const VIEW_REGISTRY = {
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

  const stats = useDashboardStats(user?.role);
  const isLive = view === 'general-1'; // default view = real headline counts
  const ViewComponent = VIEW_REGISTRY[view];

  const statQueries = [stats.students, stats.staff, stats.classes, stats.branches];
  const refreshing = statQueries.some((q) => q?.isFetching && !q?.isLoading);
  const refetchStats = () => statQueries.forEach((q) => q?.refetch?.());

  const quickLinks = QUICK_LINKS.filter((q) => canSee(user?.role, q.base));

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
        refreshControl={
          isLive ? (
            <RefreshControl refreshing={refreshing} onRefresh={refetchStats} tintColor={COLORS.brand} />
          ) : undefined
        }
      >
        {isLive ? (
          <LiveSummary stats={stats} role={user?.role} onTile={(p) => router.push(p)} />
        ) : ViewComponent ? (
          <ViewComponent />
        ) : null}

        {quickLinks.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Quick Actions</Text>
            <View style={styles.quickGrid}>
              {quickLinks.map((q) => (
                <Pressable
                  key={q.label}
                  onPress={() => router.push(q.path)}
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
        )}
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

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 18,
    padding: 16,
    gap: 6,
    minHeight: 110,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 34 },
  statLabel: { color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '700' },
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
