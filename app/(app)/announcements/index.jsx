import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../src/store/userStore';
import { useColors } from '../../../src/theme/useColors';
import { COLORS } from '../../../src/theme/colors';
import FeedPanel from '../../../src/component/announcement/FeedPanel';
import AnnouncementsListPanel from '../../../src/component/announcement/AnnouncementsListPanel';

export default function AnnouncementsScreen() {
  const C = useColors();
  const { user } = useUserStore();
  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;

  const canManage =
    isAdmin ||
    actions.includes('view-announcement') ||
    actions.includes('view-all-branch-announcement') ||
    actions.includes('create-announcement') ||
    actions.includes('create-all-branch-announcement');

  const TABS = [
    { key: 'feed', label: 'Feed', icon: 'inbox' },
    canManage && { key: 'manage', label: 'Manage', icon: 'edit-3' },
  ].filter(Boolean);

  const [tab, setTab] = useState(TABS[0].key);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Announcements</Text>
        <Text style={[styles.sub, { color: C.muted }]}>
          School notices, events, and updates
        </Text>
      </View>

      {TABS.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={({ pressed }) => [
                  styles.tab,
                  { backgroundColor: C.card, borderColor: C.border },
                  active && styles.tabActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Feather name={t.icon} size={14} color={active ? '#fff' : C.muted} />
                <Text style={[styles.tabLabel, { color: active ? '#fff' : C.text }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={{ flex: 1 }}>
        {tab === 'feed' && <FeedPanel />}
        {tab === 'manage' && <AnnouncementsListPanel />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 14, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 4 },

  tabScroll: { flexGrow: 0, flexShrink: 0 },
  tabRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  tabLabel: { fontSize: 13, fontWeight: '700' },
});
