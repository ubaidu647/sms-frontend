import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  useClassDetail,
  useToggleClassStatus,
} from '../../../../src/hooks/useClasses';
import { useUserStore } from '../../../../src/store/userStore';
import { useColors } from '../../../../src/theme/useColors';
import { COLORS } from '../../../../src/theme/colors';
import {
  TYPE_PILL,
  MEDIUM_PILL,
  STATUS_PILL,
  titleCase,
  fmtDate,
} from '../../../../src/constants/classes';
import { hasAnyAction } from '../../../../src/utils/permissions';
import EditClassModal from '../../../../src/component/EditClassModal';
import SectionsModal from '../../../../src/component/SectionsModal';

function InfoRow({ icon, label, value, fallback = '—' }) {
  const C = useColors();
  return (
    <View style={[styles.infoRow, { backgroundColor: C.bg, borderColor: C.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: C.card, borderColor: C.border }]}>
        <Feather name={icon} size={14} color={COLORS.brand} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.infoLabel, { color: C.muted }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.infoValue, { color: C.text }]}>{value || fallback}</Text>
      </View>
    </View>
  );
}

function Pill({ bg, fg, label }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export default function ClassDetailPage() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const C = useColors();
  const { user } = useUserStore();

  const isAdmin = !!user?.role?.isPredefined;
  const canUpdate =
    isAdmin || hasAnyAction(user?.role, ['update-class', 'update-all-branch-class']);
  const canToggle =
    isAdmin || hasAnyAction(user?.role, ['delete-class', 'delete-all-branch-class']);
  const canCreate =
    isAdmin || hasAnyAction(user?.role, ['create-class', 'create-all-branch-class']);

  const { data, isLoading, error } = useClassDetail(classId);
  const cls = data?.data;

  const [editOpen, setEditOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const toggle = useToggleClassStatus();

  const onToggle = () => {
    Alert.alert(
      cls?.isActive ? 'Deactivate Class' : 'Activate Class',
      `Are you sure you want to ${cls?.isActive ? 'deactivate' : 'activate'} ${cls?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => toggle.mutate(classId) },
      ],
    );
  };

  if (isLoading && !cls) {
    return (
      <View style={[styles.safe, { backgroundColor: C.bg }]}>
        <Header onBack={() => router.back()} C={C} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brand} />
        </View>
      </View>
    );
  }

  if (error || !cls) {
    const msg =
      error?.response?.data?.message || error?.message || 'Class not found';
    return (
      <View style={[styles.safe, { backgroundColor: C.bg }]}>
        <Header onBack={() => router.back()} C={C} />
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={18} color="#b91c1c" />
          <Text style={styles.errorText}>{msg}</Text>
        </View>
      </View>
    );
  }

  const typeP = TYPE_PILL[cls.classType] || { bg: C.border, fg: C.text };
  const medP = MEDIUM_PILL[cls.medium] || { bg: C.border, fg: C.text };
  const statusP = cls.isActive ? STATUS_PILL.active : STATUS_PILL.inactive;

  const teacher =
    cls.classTeacherInfo?.user?.name ||
    (typeof cls.classTeacher === 'object' ? cls.classTeacher?.user?.name : null);
  const teacherDesignation =
    cls.classTeacherInfo?.designation ||
    (typeof cls.classTeacher === 'object' ? cls.classTeacher?.designation : null);

  return (
    <View style={[styles.safe, { backgroundColor: C.bg }]}>
      <Header onBack={() => router.back()} C={C} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.identityCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.identityTop}>
            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeText}>{cls.grade?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.name, { color: C.text }]} numberOfLines={2}>
                {cls.name}
              </Text>
              {!!cls.serialNumber && (
                <Text style={[styles.serial, { color: C.mutedSoft }]}>
                  {cls.serialNumber}
                </Text>
              )}
              {!!cls.academicYear && (
                <Text style={[styles.serial, { color: C.mutedSoft }]}>
                  Year {cls.academicYear}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.pillRow}>
            <Pill {...statusP} />
            <Pill bg={typeP.bg} fg={typeP.fg} label={titleCase(cls.classType)} />
            <Pill bg={medP.bg} fg={medP.fg} label={titleCase(cls.medium)} />
            {!!cls.branch?.name && (
              <Pill bg={C.border} fg={C.text} label={cls.branch.name} />
            )}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={() => setSectionsOpen(true)}
              style={({ pressed }) => [
                styles.actBtn,
                styles.actBtnPrimary,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Feather name="layers" size={14} color="#fff" />
              <Text style={styles.actBtnPrimaryText}>Sections</Text>
            </Pressable>
            {canUpdate && (
              <Pressable
                onPress={() => setEditOpen(true)}
                style={({ pressed }) => [
                  styles.actBtn,
                  { backgroundColor: '#0ea5e9' },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Feather name="edit-2" size={14} color="#fff" />
                <Text style={styles.actBtnPrimaryText}>Edit</Text>
              </Pressable>
            )}
            {canToggle && (
              <Pressable
                onPress={onToggle}
                disabled={toggle.isPending}
                style={({ pressed }) => [
                  styles.actBtn,
                  { backgroundColor: cls.isActive ? '#f59e0b' : '#10b981' },
                  pressed && { opacity: 0.9 },
                ]}
              >
                {toggle.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather
                      name={cls.isActive ? 'slash' : 'check-circle'}
                      size={14}
                      color="#fff"
                    />
                    <Text style={styles.actBtnPrimaryText}>
                      {cls.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>

        <Section title="Class Info" C={C}>
          <InfoRow icon="bookmark" label="Name" value={cls.name} />
          <InfoRow icon="hash" label="Serial No." value={cls.serialNumber} />
          <InfoRow icon="bar-chart-2" label="Grade" value={titleCase(cls.grade)} />
          <InfoRow icon="tag" label="Class Type" value={titleCase(cls.classType)} />
          <InfoRow icon="globe" label="Medium" value={titleCase(cls.medium)} />
          <InfoRow icon="calendar" label="Academic Year" value={cls.academicYear} />
          <InfoRow
            icon="users"
            label="Total Capacity"
            value={cls.totalCapacity != null ? String(cls.totalCapacity) : null}
          />
          <InfoRow
            icon="layers"
            label="Sections"
            value={cls.sectionCount != null ? String(cls.sectionCount) : null}
          />
          <InfoRow icon="git-branch" label="Branch" value={cls.branch?.name} />
          <InfoRow
            icon="user"
            label="Class Teacher"
            value={teacher}
            fallback="Not assigned"
          />
          {!!teacherDesignation && (
            <InfoRow icon="briefcase" label="Designation" value={teacherDesignation} />
          )}
          <InfoRow icon="calendar" label="Created" value={fmtDate(cls.createdAt)} />
        </Section>
      </ScrollView>

      <EditClassModal open={editOpen} cls={cls} onClose={() => setEditOpen(false)} />
      <SectionsModal
        open={sectionsOpen}
        cls={cls}
        onClose={() => setSectionsOpen(false)}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canToggle={canToggle}
      />
    </View>
  );
}

function Section({ title, children, C }) {
  return (
    <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
      <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function Header({ onBack, C }) {
  return (
    <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.border }]}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={({ pressed }) => [
          styles.backBtn,
          { backgroundColor: C.bg },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Feather name="arrow-left" size={20} color={C.text} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerKicker, { color: C.muted }]}>Classes /</Text>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          Class Details
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerKicker: { fontSize: 11, fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '800' },

  body: { padding: 14, paddingBottom: 32, gap: 14 },

  identityCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  identityTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  gradeBadge: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeText: { color: '#1d4ed8', fontSize: 16, fontWeight: '800' },
  name: { fontSize: 19, fontWeight: '800' },
  serial: { fontSize: 11, marginTop: 2 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actBtn: {
    flexGrow: 1,
    flexBasis: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  actBtnPrimary: { backgroundColor: COLORS.brand },
  actBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  infoValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    margin: 16,
  },
  errorText: { color: '#b91c1c', fontSize: 13, flex: 1 },
});
