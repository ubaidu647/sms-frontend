'use client';
import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Pencil,
  BarChart3,
  Send,
  RotateCcw,
  ListChecks,
} from 'lucide-react';
import { Table } from '@/component/Table';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, deleteData, patchData } from '@/utils/api';
import toast from 'react-hot-toast';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import {
  EXAM_STATUS_COLORS,
  SUBJECT_STATUS_COLORS,
  formatDate,
} from '@/constants/exam';
import AddExamSubjectModal from '../AddExamSubjectModal';
import EditExamSubjectModal from '../EditExamSubjectModal';
import EditExamModal from '../EditExamModal';
import ConfirmModal from '../ConfirmModal';

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId;
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);
  const [editExamOpen, setEditExamOpen] = useState(false);
  const [publishTarget, setPublishTarget] = useState(null);

  const isOwnOnly = resolveScope(user?.role, 'view-exam') === 'own';
  const canUpdate =
    !isOwnOnly && hasAnyAction(user?.role, ['update-exam', 'update-all-branch-exam']);
  const canPublish = !isOwnOnly && hasAnyAction(user?.role, ['publish-exam']);
  const canEnterMarks =
    !isOwnOnly && hasAnyAction(user?.role, ['enter-marks', 'enter-all-branch-marks']);
  const canViewMarks = resolveScope(user?.role, 'view-marks') !== 'none';

  const { data: examRes, isLoading } = useQuery({
    queryKey: ['exam-detail', examId],
    queryFn: () => fetchData({ url: `/exam/${examId}`, token }),
    enabled: !!token && !!examId,
  });
  const exam = examRes?.data;
  const isLocked = exam?.status === 'published';
  const subjects = exam?.subjects || [];

  const deleteSubjectMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/exam/${examId}/subjects/${id}`, token }),
    onSuccess: () => {
      toast.success('Subject removed from exam');
      queryClient.invalidateQueries({ queryKey: ['exam-detail', examId] });
      setDeleteSubjectTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to remove subject'),
  });

  const publishMutation = useMutation({
    mutationFn: ({ publish }) =>
      patchData({ url: `/exam/${examId}/${publish ? 'publish' : 'unpublish'}`, token }),
    onSuccess: (_res, vars) => {
      toast.success(vars.publish ? 'Exam published' : 'Exam unpublished');
      queryClient.invalidateQueries({ queryKey: ['exam-detail', examId] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setPublishTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to update publish status'),
  });

  const columns = useMemo(
    () => [
      {
        header: 'Subject',
        accessor: 'subject',
        render: (v) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{v?.name || '—'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{v?.code || ''}</div>
          </div>
        ),
      },
      {
        header: 'Date',
        accessor: 'examDate',
        render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(v)}</span>,
      },
      {
        header: 'Time',
        accessor: 'startTime',
        render: (_v, row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.startTime || '—'} {row.endTime ? `→ ${row.endTime}` : ''}
          </span>
        ),
      },
      {
        header: 'Marks',
        accessor: 'totalMarks',
        render: (v, row) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <div>
              {v} <span className="text-gray-400 dark:text-gray-500">total</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">Pass: {row.passingMarks}</div>
          </div>
        ),
      },
      {
        header: 'Theory / Practical',
        accessor: 'theoryMarks',
        render: (v, row) => (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {v != null ? `T: ${v}` : 'T: —'} / {row.practicalMarks != null ? `P: ${row.practicalMarks}` : 'P: —'}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              SUBJECT_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {v}
          </span>
        ),
      },
    ],
    [],
  );
  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [];
    if (canEnterMarks)
      items.push({ label: 'Enter Marks', value: 'marks', icon: Pencil });
    if (canViewMarks)
      items.push({ label: 'View Results', value: 'results', icon: ListChecks });
    if (canUpdate && !isLocked) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canUpdate && !isLocked)
      items.push({ label: 'Remove', value: 'delete', icon: Trash2 });
    return items;
  };

  const handleSubjectAction = (action, row) => {
    if (action === 'edit') setEditSubject(row);
    if (action === 'delete') setDeleteSubjectTarget(row);
    if (action === 'marks')
      router.push(`/dashboard/school/exams/${examId}/marks?examSubjectId=${row._id}`);
    if (action === 'results')
      router.push(
        `/dashboard/school/exams/${examId}/marks?examSubjectId=${row._id}&view=1`,
      );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
        <div className="max-w-7xl mx-auto text-gray-500 dark:text-gray-400">Loading exam…</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
        <div className="max-w-7xl mx-auto text-gray-500 dark:text-gray-400">Exam not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.push('/dashboard/school/exams')}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to exams
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{exam.name}</h1>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    EXAM_STATUS_COLORS[exam.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {exam.status}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                  {exam.type}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{exam.serialNumber}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canEnterMarks && (
                <button
                  onClick={() => router.push(`/dashboard/school/exams/${examId}/marks`)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                >
                  <Pencil className="w-4 h-4" /> Enter Marks
                </button>
              )}
              {canViewMarks && (
                <button
                  onClick={() =>
                    router.push(`/dashboard/school/exams/${examId}/section-summary`)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  <BarChart3 className="w-4 h-4" /> Section Summary
                </button>
              )}
              {canUpdate && !isLocked && (
                <button
                  onClick={() => setEditExamOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                >
                  <Edit className="w-4 h-4" /> Edit Exam
                </button>
              )}
              {canPublish && (
                <button
                  onClick={() =>
                    setPublishTarget({ publish: !isLocked })
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                    isLocked
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isLocked ? <RotateCcw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  {isLocked ? 'Unpublish' : 'Publish'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Stat label="Class" value={exam.class?.name} sub={exam.class?.grade ? `Grade ${exam.class.grade}` : ''} />
            <Stat label="Academic Year" value={exam.academicYear} />
            <Stat label="Schedule" value={`${formatDate(exam.startDate)} → ${formatDate(exam.endDate)}`} />
            <Stat
              label="Total Marks"
              value={exam.totalMarks}
              sub={`Passing ≥ ${exam.passingPercentage}%`}
            />
          </div>

          {exam.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              {exam.description}
            </p>
          )}

          {isLocked && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 rounded-lg text-purple-800 text-sm">
              This exam is published. Unpublish to edit subjects or marks.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Subjects</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subjects.length} subject{subjects.length === 1 ? '' : 's'} scheduled
              </p>
            </div>
            {canUpdate && !isLocked && (
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
              >
                <Plus className="w-4 h-4" /> Add Subject
              </button>
            )}
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
              No subjects added yet. Click <strong>Add Subject</strong> to schedule one.
            </div>
          ) : (
            <Table
              columns={columns}
              data={subjects}
              rowActions={rowActions}
              onRowAction={handleSubjectAction}
              showImage={false}
              visibleColumns={visibleColumns}
            />
          )}
        </div>

        <AddExamSubjectModal
          isOpen={isAddSubjectOpen}
          onClose={() => setIsAddSubjectOpen(false)}
          onSuccess={() => setIsAddSubjectOpen(false)}
          examId={examId}
          classId={exam.class?._id || exam.classId}
        />

        <EditExamSubjectModal
          isOpen={!!editSubject}
          onClose={() => setEditSubject(null)}
          onSuccess={() => setEditSubject(null)}
          examId={examId}
          examSubject={editSubject}
        />

        <EditExamModal
          isOpen={editExamOpen}
          onClose={() => setEditExamOpen(false)}
          onSuccess={() => setEditExamOpen(false)}
          exam={exam}
        />

        <ConfirmModal
          isOpen={!!deleteSubjectTarget}
          onClose={() => setDeleteSubjectTarget(null)}
          title="Remove Subject from Exam"
          message={
            deleteSubjectTarget
              ? `Remove "${deleteSubjectTarget.subject?.name}" from this exam? All entered marks for this subject will be deleted.`
              : ''
          }
          confirmLabel="Remove"
          confirmTone="danger"
          loading={deleteSubjectMutation.isPending}
          onConfirm={() => deleteSubjectMutation.mutate(deleteSubjectTarget._id)}
        />

        <ConfirmModal
          isOpen={!!publishTarget}
          onClose={() => setPublishTarget(null)}
          title={publishTarget?.publish ? 'Publish Exam Results' : 'Unpublish Exam Results'}
          message={
            publishTarget?.publish
              ? 'Publish results? Once published, marks cannot be edited until you unpublish.'
              : 'Unpublish? Results will become editable again.'
          }
          confirmLabel={publishTarget?.publish ? 'Publish' : 'Unpublish'}
          confirmTone={publishTarget?.publish ? 'primary' : 'warning'}
          loading={publishMutation.isPending}
          onConfirm={() => publishMutation.mutate({ publish: publishTarget.publish })}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl p-3">
      <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">{label}</p>
      <p className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}
