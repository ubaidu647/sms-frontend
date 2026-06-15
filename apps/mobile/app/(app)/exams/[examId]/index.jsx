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
  useDeleteExam,
  useDeleteExamSubject,
  useExamDetail,
  usePublishExam,
} from '../../../../src/hooks/useExams';
import { useUserStore } from '../../../../src/store/userStore';
import { useColors } from '../../../../src/theme/useColors';
import { COLORS } from '../../../../src/theme/colors';
import { hasAnyAction, resolveScope } from '../../../../src/utils/permissions';
import {
  EXAM_STATUS_PILL,
  EXAM_SUBJECT_STATUS_PILL,
  formatDate,
  titleCase,
} from '../../../../src/constants/exam';
import ExamFormModal from '../../../../src/component/exam/ExamFormModal';
import ExamSubjectFormModal from '../../../../src/component/exam/ExamSubjectFormModal';

function Pill({ label, bg, fg }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function Stat({ label, value, sub, C }) {
  return (
    <View style={[styles.stat, { backgroundColor: C.bg, borderColor: C.border }]}>
      <Text style={[styles.statLabel, { color: C.mutedSoft }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.statValue, { color: C.text }]} numberOfLines={1}>
        {value ?? '—'}
      </Text>
      {!!sub && (
        <Text style={[styles.statSub, { color: C.mutedSoft }]} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </View>
  );
}

function SubjectRow({ s, canManage, isLocked, onEdit, onDelete, onMarks, onResults, canEnter, canView, C }) {
  const cfg = EXAM_SUBJECT_STATUS_PILL[s.status] || EXAM_SUBJECT_STATUS_PILL.planned;
  return (
    <View style={[styles.subjectRow, { borderColor: C.border, backgroundColor: C.card }]}>
      <View style={styles.subjectHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.subjectName, { color: C.text }]} numberOfLines={1}>
            {s.subject?.name || '—'}
            {s.subject?.code ? (
              <Text style={[styles.subjectCode, { color: C.mutedSoft }]}>
                {' '}
                · {s.subject.code}
              </Text>
            ) : null}
          </Text>
          <Text style={[styles.subjectMeta, { color: C.muted }]} numberOfLines={1}>
            {formatDate(s.examDate)}
            {s.startTime ? ` · ${s.startTime}` : ''}
            {s.endTime ? ` → ${s.endTime}` : ''}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.pillText, { color: cfg.fg }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.subjectMarks}>
        <Text style={[styles.marksLabel, { color: C.mutedSoft }]}>
          Total <Text style={[styles.marksValue, { color: C.text }]}>{s.totalMarks}</Text>
          {'  ·  '}Pass <Text style={[styles.marksValue, { color: C.text }]}>{s.passingMarks}</Text>
        </Text>
        {(s.theoryMarks != null || s.practicalMarks != null) && (
          <Text style={[styles.marksLabel, { color: C.mutedSoft }]}>
            T: <Text style={[styles.marksValue, { color: C.text }]}>{s.theoryMarks ?? '—'}</Text>
            {'  /  '}P: <Text style={[styles.marksValue, { color: C.text }]}>{s.practicalMarks ?? '—'}</Text>
          </Text>
        )}
      </View>

      <View style={styles.subjectActions}>
        {canEnter && (
          <Pressable
            onPress={onMarks}
            style={({ pressed }) => [
              styles.subjectActionBtn,
              { backgroundColor: COLORS.brand },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Feather name="edit-3" size={12} color="#fff" />
            <Text style={styles.subjectActionBtnText}>Marks</Text>
          </Pressable>
        )}
        {canView && !canEnter && (
          <Pressable
            onPress={onResults}
            style={({ pressed }) => [
              styles.subjectActionBtn,
              { backgroundColor: '#2563eb' },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Feather name="list" size={12} color="#fff" />
            <Text style={styles.subjectActionBtnText}>Results</Text>
          </Pressable>
        )}
        {canManage && !isLocked && (
          <>
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [
                styles.subjectActionBtnGhost,
                { borderColor: C.border, backgroundColor: C.bg },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name="edit-2" size={12} color={C.text} />
              <Text style={[styles.subjectActionBtnGhostText, { color: C.text }]}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [
                styles.subjectActionBtn,
                { backgroundColor: '#b91c1c' },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name="trash-2" size={12} color="#fff" />
              <Text style={styles.subjectActionBtnText}>Remove</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

export default function ExamDetailPage() {
  const { examId } = useLocalSearchParams();
  const router = useRouter();
  const C = useColors();
  const { user } = useUserStore();

  const { data: exam, isLoading, error } = useExamDetail({ id: examId });

  const examScope = resolveScope(user?.role, 'view-exam');
  const isOwnOnly = examScope === 'own';
  const marksScope = resolveScope(user?.role, 'view-marks');

  const canUpdate =
    !isOwnOnly && hasAnyAction(user?.role, ['update-exam', 'update-all-branch-exam']);
  const canDelete =
    !isOwnOnly && hasAnyAction(user?.role, ['delete-exam', 'delete-all-branch-exam']);
  const canPublish = !isOwnOnly && hasAnyAction(user?.role, ['publish-exam']);
  const canEnterMarks =
    !isOwnOnly && hasAnyAction(user?.role, ['enter-marks', 'enter-all-branch-marks']);
  const canViewMarks = marksScope !== 'none';

  const [editExamOpen, setEditExamOpen] = useState(false);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const publish = usePublishExam({ id: examId });
  const del = useDeleteExam({ onSuccess: () => router.back() });
  const delSubject = useDeleteExamSubject({ examId });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  if (error || !exam) {
    const forbidden = error?.response?.status === 403;
    return (
      <View style={[styles.center, { backgroundColor: C.bg }]}>
        <Feather name="alert-circle" size={36} color={COLORS.red} />
        <Text style={[styles.errorText, { color: C.muted, textAlign: 'center' }]}>
          {forbidden
            ? error?.response?.data?.message || 'You are not assigned to this exam class'
            : error?.response?.data?.message || error?.message || 'Exam not found'}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const status = exam.status;
  const isLocked = status === 'published';
  const subjects = exam.subjects || [];
  const cfg = EXAM_STATUS_PILL[status] || EXAM_STATUS_PILL.planned;

  const onPublishToggle = () => {
    Alert.alert(
      isLocked ? 'Unpublish Results' : 'Publish Results',
      isLocked
        ? 'Unpublish? Results will become editable again.'
        : 'Publish results? Once published, marks cannot be edited until you unpublish.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isLocked ? 'Unpublish' : 'Publish',
          onPress: () => publish.mutate(!isLocked),
        },
      ],
    );
  };

  const onDeleteExam = () => {
    Alert.alert(
      'Delete Exam',
      `Delete "${exam.name}"? This sets the exam to inactive.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => del.mutate(exam._id),
        },
      ],
    );
  };

  const onRemoveSubject = (s) => {
    Alert.alert(
      'Remove Subject',
      `Remove "${s.subject?.name}" from this exam? All entered marks for this subject will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => delSubject.mutate(s._id),
        },
      ],
    );
  };

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
              {exam.name}
            </Text>
            <Text style={[styles.subtitle, { color: C.muted }]} numberOfLines={1}>
              {exam.serialNumber || '—'} · {exam.academicYear}
            </Text>
          </View>
        </View>

        <View style={styles.pillsTop}>
          <Pill label={cfg.label} bg={cfg.bg} fg={cfg.fg} />
          <Pill label={titleCase(exam.type)} bg="#eef2ff" fg="#3730a3" />
        </View>

        {isLocked && (
          <View style={[styles.banner, { backgroundColor: '#ede9fe', borderColor: '#ddd6fe' }]}>
            <Feather name="lock" size={14} color="#5b21b6" />
            <Text style={[styles.bannerText, { color: '#5b21b6' }]}>
              This exam is published. Unpublish to edit subjects or marks.
            </Text>
          </View>
        )}

        <View style={styles.statGrid}>
          <Stat label="Class" value={exam.class?.name} sub={exam.class?.grade ? `Gr ${exam.class.grade}` : ''} C={C} />
          <Stat label="Year" value={exam.academicYear} C={C} />
          <Stat label="Schedule" value={`${formatDate(exam.startDate)} → ${formatDate(exam.endDate)}`} C={C} />
          <Stat label="Total Marks" value={`${exam.totalMarks ?? 0}`} sub={`Passing ≥ ${exam.passingPercentage}%`} C={C} />
        </View>

        {!!exam.description && (
          <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.sectionTitle, { color: C.muted }]}>DESCRIPTION</Text>
            <Text style={[styles.description, { color: C.text }]}>{exam.description}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          {canEnterMarks && (
            <Pressable
              onPress={() => router.push(`/(app)/exams/${examId}/marks`)}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: COLORS.brand },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Feather name="edit-3" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Enter Marks</Text>
            </Pressable>
          )}
          {canViewMarks && (
            <Pressable
              onPress={() => router.push(`/(app)/exams/${examId}/section-summary`)}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: '#2563eb' },
                pressed && { opacity: 0.9 },
              ]}
            >
              <Feather name="bar-chart-2" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Summary</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.actionsRow}>
          {canUpdate && !isLocked && (
            <Pressable
              onPress={() => setEditExamOpen(true)}
              style={({ pressed }) => [
                styles.actionBtnGhost,
                { borderColor: C.border, backgroundColor: C.card },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Feather name="edit-2" size={14} color={C.text} />
              <Text style={[styles.actionBtnGhostText, { color: C.text }]}>Edit Exam</Text>
            </Pressable>
          )}
          {canPublish && (
            <Pressable
              onPress={onPublishToggle}
              disabled={publish.isPending}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: isLocked ? '#b45309' : '#7c3aed' },
                (publish.isPending || pressed) && { opacity: 0.85 },
              ]}
            >
              {publish.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name={isLocked ? 'rotate-ccw' : 'send'} size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>{isLocked ? 'Unpublish' : 'Publish'}</Text>
                </>
              )}
            </Pressable>
          )}
          {canDelete && !isLocked && (
            <Pressable
              onPress={onDeleteExam}
              disabled={del.isPending}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: '#b91c1c' },
                (del.isPending || pressed) && { opacity: 0.85 },
              ]}
            >
              <Feather name="trash-2" size={14} color="#fff" />
              <Text style={styles.actionBtnText}>Delete</Text>
            </Pressable>
          )}
        </View>

        {/* Subjects */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.subjectSectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: C.text, fontSize: 14 }]}>
                Subject Papers
              </Text>
              <Text style={[styles.sectionSub, { color: C.muted }]}>
                {subjects.length} subject{subjects.length === 1 ? '' : 's'} scheduled
              </Text>
            </View>
            {canUpdate && !isLocked && (
              <Pressable
                onPress={() => setAddSubjectOpen(true)}
                style={({ pressed }) => [
                  styles.addSubjectBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={styles.addSubjectBtnText}>Add</Text>
              </Pressable>
            )}
          </View>

          {subjects.length === 0 ? (
            <Text style={[styles.emptySubjects, { color: C.mutedSoft }]}>
              {canUpdate && !isLocked
                ? 'No subjects added yet. Tap Add to schedule one.'
                : 'No subjects scheduled for this exam.'}
            </Text>
          ) : (
            <View style={{ gap: 8 }}>
              {subjects.map((s) => (
                <SubjectRow
                  key={s._id}
                  s={s}
                  canManage={canUpdate}
                  isLocked={isLocked}
                  canEnter={canEnterMarks}
                  canView={canViewMarks}
                  onEdit={() => setEditSubject(s)}
                  onDelete={() => onRemoveSubject(s)}
                  onMarks={() =>
                    router.push(`/(app)/exams/${examId}/marks?examSubjectId=${s._id}`)
                  }
                  onResults={() =>
                    router.push(
                      `/(app)/exams/${examId}/marks?examSubjectId=${s._id}&view=1`,
                    )
                  }
                  C={C}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ExamFormModal open={editExamOpen} exam={exam} onClose={() => setEditExamOpen(false)} />
      <ExamSubjectFormModal
        open={addSubjectOpen}
        examId={examId}
        classId={exam.class?._id || exam.classId}
        academicYear={exam.academicYear}
        onClose={() => setAddSubjectOpen(false)}
      />
      <ExamSubjectFormModal
        open={!!editSubject}
        examId={examId}
        classId={exam.class?._id || exam.classId}
        academicYear={exam.academicYear}
        examSubject={editSubject}
        onClose={() => setEditSubject(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 14, paddingBottom: 32, gap: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 14 },
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

  pillsTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: '800' },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  bannerText: { fontSize: 12, flex: 1 },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statLabel: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800' },
  statValue: { fontSize: 14, fontWeight: '800' },
  statSub: { fontSize: 11 },

  section: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  sectionTitle: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800' },
  sectionSub: { fontSize: 12, marginTop: 2 },
  description: { fontSize: 13, lineHeight: 18 },

  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
  },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionBtnGhost: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnGhostText: { fontWeight: '700', fontSize: 13 },

  subjectSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
  },
  addSubjectBtnText: { color: '#fff', fontWeight: '800', fontSize: 11 },

  emptySubjects: { fontSize: 12, textAlign: 'center', paddingVertical: 16 },

  subjectRow: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 8 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectName: { fontSize: 14, fontWeight: '800' },
  subjectCode: { fontSize: 11, fontWeight: '500' },
  subjectMeta: { fontSize: 11, marginTop: 2 },
  subjectMarks: { gap: 2 },
  marksLabel: { fontSize: 11 },
  marksValue: { fontSize: 12, fontWeight: '800' },

  subjectActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  subjectActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 8,
  },
  subjectActionBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  subjectActionBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
  },
  subjectActionBtnGhostText: { fontSize: 11, fontWeight: '700' },
});
