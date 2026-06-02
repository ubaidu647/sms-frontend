import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../src/store/userStore';
import { useColors } from '../../../src/theme/useColors';
import { COLORS } from '../../../src/theme/colors';
import { hasAnyAction, resolveScope } from '../../../src/utils/permissions';
import EditorPanel from '../../../src/component/timetable/EditorPanel';
import PeriodConfigsPanel from '../../../src/component/timetable/PeriodConfigsPanel';
import NowPanel from '../../../src/component/timetable/NowPanel';
import FreeTeachersPanel from '../../../src/component/timetable/FreeTeachersPanel';
import ConflictsPanel from '../../../src/component/timetable/ConflictsPanel';
import MyTimetablePanel from '../../../src/component/timetable/MyTimetablePanel';

export default function TimetableScreen() {
  const C = useColors();
  const { user } = useUserStore();

  const scope = resolveScope(user?.role, 'view-timetable');
  const isOwnOnly = scope === 'own';
  const canView = scope !== 'none';
  const canEdit =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'create-timetable',
      'update-timetable',
      'create-all-branch-timetable',
      'update-all-branch-timetable',
    ]);

  // Own-scope users see only the personal view.
  if (isOwnOnly) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>My Schedule</Text>
          <Text style={[styles.sub, { color: C.muted }]}>
            Your weekly classes and rooms
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <MyTimetablePanel />
        </View>
      </View>
    );
  }

  const TABS = [
    canView && { key: 'editor', label: 'Editor', icon: 'calendar' },
    canEdit && { key: 'configs', label: 'Configs', icon: 'sliders' },
    canView && { key: 'now', label: 'Now', icon: 'clock' },
    canView && { key: 'free', label: 'Free', icon: 'user-check' },
    canView && { key: 'conflicts', label: 'Conflicts', icon: 'alert-circle' },
    canView && { key: 'my', label: 'My Schedule', icon: 'user' },
  ].filter(Boolean);

  const [tab, setTab] = useState(TABS[0]?.key || 'editor');

  if (TABS.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={styles.center}>
          <Feather name="lock" size={36} color={COLORS.red} />
          <Text style={[styles.title, { color: C.text }]}>No access</Text>
          <Text style={[styles.sub, { color: C.muted, textAlign: 'center' }]}>
            You don't have permission to view timetables.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: C.text }]}>Timetable</Text>
        <Text style={[styles.sub, { color: C.muted }]}>
          Period configs, section editor, live now and conflicts
        </Text>
      </View>

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

      <View style={{ flex: 1 }}>
        {tab === 'editor' && <EditorPanel />}
        {tab === 'configs' && <PeriodConfigsPanel />}
        {tab === 'now' && <NowPanel />}
        {tab === 'free' && <FreeTeachersPanel />}
        {tab === 'conflicts' && <ConflictsPanel />}
        {tab === 'my' && <MyTimetablePanel />}
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
});
