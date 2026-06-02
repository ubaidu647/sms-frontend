import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  useAssignmentDetail,
  useDeleteAssignment,
} from '../../../../src/hooks/useTeacherAssignments';
import { useUserStore } from '../../../../src/store/userStore';
import { useColors } from '../../../../src/theme/useColors';
import { COLORS } from '../../../../src/theme/colors';
import { hasAnyAction } from '../../../../src/utils/permissions';
import { ROLE_PILL, fmtDate, titleCase } from '../../../../src/constants/teacherAssignment';
import EditAssignmentModal from '../../../../src/component/teacherAssignment/EditAssignmentModal';

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

function Pill({ label, bg, fg, icon }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon && <Feather name={icon} size={11} color={fg} />}
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const { assignmentId } = useLocalSearchParams();
  const C = useColors();
  const { user } = useUserStore();

  const { data: a, isLoading, error } = useAssignmentDetail({ id: assignmentId });

  const userBranchId =
    (typeof user?.branchId === 'string' && user.branchId) ||
    user?.branchId?._id ||
    user?.branch?._id ||
    null;

  const canUpdate = hasAnyAction(user?.role, [
    'update-teaching-assignment',
    'update-all-branch-teaching-assignment',
  ]);
  const canDelete = hasAnyAction(user?.role, [
    'delete-teaching-assignment',
    'delete-all-branch-teaching-assignment',
  ]);
  const canActOnAllBranches =
    !!user?.role?.isPredefined ||
    !!user?.role?.actions?.includes('update-all-branch-teaching-assignment') ||
    !!user?.role?.actions?.includes('delete-all-branch-teaching-assignment');

  const branchScopeOk =
    canActOnAllBranches ||
    (userBranchId && a?.branchId && String(userBranchId) === String(a.branchId));

  const [editOpen, setEditOpen] = useState(false);
  const del = useDeleteAssignment({ onSuccess: () => router.back() });

  const onUnassign = () => {
    if (!a?._id) return;
    Alert.alert(
      'Unassign Teacher',
      `Unassign ${a.staff?.user?.name || 'this teacher'} from ${a.subject?.name || 'this subject'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: () => del.mutate(a._id),
        },
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

  if (error || !a) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Feather name="alert-circle" size={36} color={COLORS.red} />
        <Text style={[styles.errorText, { color: C.muted }]}>
          {error?.response?.data?.message || error?.message || 'Assignment not found'}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const rolePill = ROLE_PILL[a.role] || ROLE_PILL.teacher;
  const teacherName = a.staff?.user?.name || '—';
  const initials =
    teacherName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || '?';

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
              Assignment
            </Text>
            <Text style={[styles.subtitle, { color: C.muted }]} numberOfLines={1}>
              {a.serialNumber || '—'} · {a.academicYear}
            </Text>
          </View>
        </View>

        {/* Teacher card */}
        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.teacherRow}>
            {a.staff?.photo ? (
              <Image source={{ uri: a.staff.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.teacherName, { color: C.text }]} numberOfLines={1}>
                {teacherName}
              </Text>
              <Text style={[styles.teacherMeta, { color: C.muted }]} numberOfLines={1}>
                {a.staff?.designation || '—'}
                {a.staff?.serialNumber ? ` · ${a.staff.serialNumber}` : ''}
              </Text>
              {!!a.staff?.user?.email && (
                <Text style={[styles.teacherEmail, { color: C.mutedSoft }]} numberOfLines={1}>
                  {a.staff.user.email}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.pillRow}>
            <Pill label={rolePill.label} bg={rolePill.bg} fg={rolePill.fg} />
            {a.isPrimary && (
              <Pill label="Primary" bg="#fef3c7" fg="#92400e" icon="star" />
            )}
            <Pill
              label={a.isActive ? 'Active' : 'Inactive'}
              bg={a.isActive ? '#dcfce7' : '#fee2e2'}
              fg={a.isActive ? '#166534' : '#991b1b'}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Subject</Text>
          <Row label="Name" value={a.subject?.name} C={C} />
          <Row label="Code" value={a.subject?.code} C={C} />
          <Row label="Type" value={titleCase(a.subject?.subjectType)} C={C} />
          {a.subject?.totalMarks != null && (
            <Row label="Total Marks" value={a.subject.totalMarks} C={C} />
          )}
        </View>

        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Class & Section</Text>
          <Row label="Class" value={a.class?.name} C={C} />
          <Row label="Grade" value={a.class?.grade} C={C} />
          <Row label="Class Type" value={titleCase(a.class?.classType)} C={C} />
          <Row label="Medium" value={titleCase(a.class?.medium)} C={C} />
          <Row label="Section" value={a.section?.name} C={C} />
          {a.section?.currentStrength != null && (
            <Row
              label="Section Strength"
              value={`${a.section.currentStrength}/${a.section.capacity}`}
              C={C}
            />
          )}
          {a.branch?.name && <Row label="Branch" value={a.branch.name} C={C} />}
        </View>

        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Period</Text>
          <Row label="Start" value={fmtDate(a.startDate)} C={C} />
          <Row label="End" value={fmtDate(a.endDate)} C={C} />
          <Row label="Created" value={fmtDate(a.createdAt)} C={C} />
          <Row label="Updated" value={fmtDate(a.updatedAt)} C={C} />
        </View>

        {!!a.notes && (
          <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: C.text }]}>{a.notes}</Text>
          </View>
        )}

        {(canUpdate || canDelete) && branchScopeOk && (
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
            {canDelete && (
              <Pressable
                onPress={onUnassign}
                disabled={del.isPending}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: '#b91c1c' },
                  (del.isPending || pressed) && { opacity: 0.85 },
                ]}
              >
                {del.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="trash-2" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Unassign</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <EditAssignmentModal
        open={editOpen}
        assignment={a}
        onClose={() => setEditOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 14, paddingBottom: 32, gap: 12 },

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
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },

  card: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },

  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  teacherName: { fontSize: 16, fontWeight: '800' },
  teacherMeta: { fontSize: 12, marginTop: 2 },
  teacherEmail: { fontSize: 11, marginTop: 2 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 10, fontWeight: '800' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700' },
  rowValue: { fontSize: 13, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },

  notesText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

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
