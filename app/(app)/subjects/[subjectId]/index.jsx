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
  useSubjectDetail,
  useToggleSubjectStatus,
} from '../../../../src/hooks/useSubjects';
import { useUserStore } from '../../../../src/store/userStore';
import { useColors } from '../../../../src/theme/useColors';
import { COLORS } from '../../../../src/theme/colors';
import { hasAnyAction, resolveScope } from '../../../../src/utils/permissions';
import {
  SUBJECT_CATEGORY_PILL,
  SUBJECT_TYPE_PILL,
  titleCase,
} from '../../../../src/constants/subject';
import EditSubjectModal from '../../../../src/component/EditSubjectModal';

function fmtDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

function Pill({ label, bg, fg }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function InfoCard({ label, value, C }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
      <Text style={[styles.infoLabel, { color: C.mutedSoft }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.infoValue, { color: C.text }]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

function Section({ title, children, C }) {
  return (
    <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
      <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value, C }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: C.mutedSoft }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.rowValue, { color: C.text }]} numberOfLines={2}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

export default function SubjectDetailPage() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams();
  const C = useColors();
  const { user } = useUserStore();

  const { data: subject, isLoading, error } = useSubjectDetail(subjectId);

  const scope = resolveScope(user?.role, 'view-subject');
  const isOwnOnly = scope === 'own';
  const canUpdate =
    !isOwnOnly && hasAnyAction(user?.role, ['update-subject', 'update-all-branch-subject']);
  const canToggle =
    !isOwnOnly && hasAnyAction(user?.role, ['delete-subject', 'delete-all-branch-subject']);

  const userBranchId =
    (typeof user?.branchId === 'string' && user.branchId) ||
    user?.branchId?._id ||
    user?.branch?._id ||
    null;

  const canActOnAllBranches =
    !!user?.role?.isPredefined ||
    !!user?.role?.actions?.includes('delete-all-branch-subject') ||
    !!user?.role?.actions?.includes('update-all-branch-subject');

  const branchScopeOk =
    canActOnAllBranches ||
    (userBranchId &&
      subject?.branchId &&
      String(userBranchId) === String(subject.branchId));

  const [editOpen, setEditOpen] = useState(false);
  const toggle = useToggleSubjectStatus();

  const onToggle = () => {
    if (!subject?._id) return;
    Alert.alert(
      subject.isActive ? 'Deactivate Subject' : 'Activate Subject',
      `Are you sure you want to ${subject.isActive ? 'deactivate' : 'activate'} "${subject.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => toggle.mutate(subject._id) },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  if (error || !subject) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Feather name="alert-circle" size={36} color={COLORS.red} />
        <Text style={[styles.errorText, { color: C.muted }]}>
          {error?.response?.data?.message || error?.message || 'Subject not found'}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const typePill = SUBJECT_TYPE_PILL[subject.subjectType];
  const catPill = SUBJECT_CATEGORY_PILL[subject.category];

  return (
    <View style={[styles.safe, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [styles.backBtnIcon, pressed && { opacity: 0.6 }]}
          >
            <Feather name="arrow-left" size={20} color={C.text} />
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
              {subject.name}
            </Text>
            <Text style={[styles.subtitle, { color: C.muted }]} numberOfLines={1}>
              {subject.code} · {subject.academicYear || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.pillsRow}>
          <Pill
            bg={subject.isActive ? '#dcfce7' : '#fee2e2'}
            fg={subject.isActive ? '#166534' : '#991b1b'}
            label={subject.isActive ? 'Active' : 'Inactive'}
          />
          {typePill && (
            <Pill bg={typePill.bg} fg={typePill.fg} label={titleCase(subject.subjectType)} />
          )}
          {catPill && (
            <Pill bg={catPill.bg} fg={catPill.fg} label={titleCase(subject.category)} />
          )}
          {subject.class?.name && (
            <Pill
              bg="#ccfbf1"
              fg="#0f766e"
              label={`${subject.class.name}${
                subject.class.grade ? ` · Gr ${subject.class.grade}` : ''
              }`}
            />
          )}
          {subject.branch?.name && (
            <Pill bg="#f3f4f6" fg="#374151" label={subject.branch.name} />
          )}
        </View>

        <View style={styles.grid}>
          <InfoCard label="Serial No." value={subject.serialNumber} C={C} />
          <InfoCard label="Credit Hours" value={subject.creditHours ?? '—'} C={C} />
          <InfoCard label="Total Marks" value={subject.totalMarks} C={C} />
          <InfoCard label="Passing" value={subject.passingMarks} C={C} />
        </View>

        <Section title="Marks Breakdown" C={C}>
          <Row label="Total" value={subject.totalMarks} C={C} />
          <Row label="Passing" value={subject.passingMarks} C={C} />
          <Row label="Theory" value={subject.theoryMarks ?? '—'} C={C} />
          <Row label="Practical" value={subject.practicalMarks ?? '—'} C={C} />
        </Section>

        <Section title="Class & Teacher" C={C}>
          <Row label="Class" value={subject.class?.name} C={C} />
          <Row label="Grade" value={subject.class?.grade ?? '—'} C={C} />
          <Row label="Class Type" value={titleCase(subject.class?.classType)} C={C} />
          <Row label="Medium" value={titleCase(subject.class?.medium)} C={C} />
          <Row label="Academic Year" value={subject.class?.academicYear || subject.academicYear} C={C} />
          <Row
            label="Default Teacher"
            value={
              subject.teacherInfo?.user?.name
                ? `${subject.teacherInfo.user.name}${
                    subject.teacherInfo.designation
                      ? ` · ${subject.teacherInfo.designation}`
                      : ''
                  }`
                : '—'
            }
            C={C}
          />
        </Section>

        <Section title="Audit" C={C}>
          <Row label="Created" value={fmtDate(subject.createdAt)} C={C} />
          <Row label="Updated" value={fmtDate(subject.updatedAt)} C={C} />
        </Section>

        {(canUpdate || canToggle) && branchScopeOk && (
          <View style={styles.actionsRow}>
            {canUpdate && (
              <Pressable
                onPress={() => setEditOpen(true)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: COLORS.brand },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Feather name="edit-2" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Edit</Text>
              </Pressable>
            )}
            {canToggle && (
              <Pressable
                onPress={onToggle}
                disabled={toggle.isPending}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: subject.isActive ? '#b45309' : '#047857' },
                  (toggle.isPending || pressed) && { opacity: 0.8 },
                ]}
              >
                {toggle.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather
                      name={subject.isActive ? 'slash' : 'check-circle'}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.actionBtnText}>
                      {subject.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <EditSubjectModal
        open={editOpen}
        subject={subject}
        onClose={() => setEditOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 14, paddingBottom: 32, gap: 14 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 14, textAlign: 'center' },
  backBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: COLORS.brand,
    borderRadius: 999,
    marginTop: 8,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },
  backBtnIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  infoLabel: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },
  infoValue: { fontSize: 14, fontWeight: '700' },

  section: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionBody: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  rowLabel: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },
  rowValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
