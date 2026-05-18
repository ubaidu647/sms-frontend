'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table } from '@/component/Table';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  ListChecks,
  Pencil,
  Send,
  RotateCcw,
  BarChart3,
  X,
  Inbox,
} from 'lucide-react';
import AddExamModal from './AddExamModal';
import EditExamModal from './EditExamModal';
import ConfirmModal from './ConfirmModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { fetchData, deleteData, patchData } from '@/utils/api';
import toast from 'react-hot-toast';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import {
  EXAM_TYPES,
  EXAM_STATUSES,
  EXAM_STATUS_COLORS,
  currentAcademicYear,
  formatDate,
} from '@/constants/exam';
import { useTranslations } from 'next-intl';

export default function ExamsPage() {
  const router = useRouter();
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('exams');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editExam, setEditExam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [publishTarget, setPublishTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters — draft state holds in-progress UI values; applied state drives the API.
  const defaultAcademicYear = currentAcademicYear();
  const [draftSearch, setDraftSearch] = useState('');
  const [draftClassId, setDraftClassId] = useState('');
  const [draftExamType, setDraftExamType] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [draftAcademicYear, setDraftAcademicYear] = useState(defaultAcademicYear);
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('true');

  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [examType, setExamType] = useState('');
  const [status, setStatus] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const applyFilters = () => {
    setSearch(draftSearch);
    setClassId(draftClassId);
    setExamType(draftExamType);
    setStatus(draftStatus);
    setAcademicYear(draftAcademicYear);
    setBranchId(draftBranchId);
    setIsActive(draftIsActive);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setDraftClassId('');
    setDraftExamType('');
    setDraftStatus('');
    setDraftAcademicYear(defaultAcademicYear);
    setDraftBranchId('');
    setDraftIsActive('true');
    setSearch('');
    setClassId('');
    setExamType('');
    setStatus('');
    setAcademicYear(defaultAcademicYear);
    setBranchId('');
    setIsActive('true');
    setPage(1);
  };

  const examScope = resolveScope(user?.role, 'view-exam');
  const marksScope = resolveScope(user?.role, 'view-marks');
  const teachingScope = resolveScope(user?.role, 'view-teaching-assignment');
  const isOrgLevel = examScope === 'all';
  const isOwnOnly = examScope === 'own' || (examScope === 'none' && marksScope === 'own');
  // Teacher-mode: role only has self-scoped teaching assignments (no branch/all-branch grant).
  // Backend narrows /exam/list to their assigned class/section/subject set.
  const isTeacherMode = teachingScope === 'own' && !user?.role?.isPredefined;
  const canCreate =
    !isOwnOnly && hasAnyAction(user?.role, ['create-exam', 'create-all-branch-exam']);
  const canUpdate =
    !isOwnOnly && hasAnyAction(user?.role, ['update-exam', 'update-all-branch-exam']);
  const canDelete =
    !isOwnOnly && hasAnyAction(user?.role, ['delete-exam', 'delete-all-branch-exam']);
  const canPublish = !isOwnOnly && hasAnyAction(user?.role, ['publish-exam']);
  const canEnterMarks =
    !isOwnOnly && hasAnyAction(user?.role, ['enter-marks', 'enter-all-branch-marks']);
  const canViewMarks = marksScope !== 'none';
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Class dropdown — branchId uses draft so picking a branch instantly refreshes class options;
  // academicYear uses applied to avoid keystroke-storms while typing.
  const draftEffectiveBranchId = isOrgLevel ? draftBranchId : userBranchId;

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', draftEffectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: draftEffectiveBranchId || undefined,
        academicYear,
      }),
    enabled: !!token && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/exam/${id}`, token }),
    onSuccess: () => {
      toast.success('Exam deleted');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete exam'),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }) =>
      patchData({ url: `/exam/${id}/${publish ? 'publish' : 'unpublish'}`, token }),
    onSuccess: (_res, vars) => {
      toast.success(vars.publish ? 'Exam published' : 'Exam unpublished');
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-detail'] });
      setPublishTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to update publish status'),
  });

  const columns = useMemo(
    () => [
      {
        header: 'Exam',
        accessor: 'name',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{row.serialNumber}</div>
          </div>
        ),
      },
      {
        header: 'Type',
        accessor: 'type',
        render: (v) => (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
            {v}
          </span>
        ),
      },
      {
        header: 'Class',
        accessor: 'class',
        render: (v) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {v?.name ?? '—'}
            {v?.grade && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(Gr {v.grade})</span>}
          </div>
        ),
      },
      {
        header: 'Year',
        accessor: 'academicYear',
        render: (v) => <span className="text-sm text-gray-600 dark:text-gray-400">{v}</span>,
      },
      {
        header: 'Schedule',
        accessor: 'startDate',
        render: (_v, row) => (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div>{formatDate(row.startDate)}</div>
            <div className="text-gray-400 dark:text-gray-500">to {formatDate(row.endDate)}</div>
          </div>
        ),
      },
      {
        header: 'Subjects',
        accessor: 'subjectCount',
        render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{v ?? 0}</span>,
      },
      {
        header: 'Total Marks',
        accessor: 'totalMarks',
        render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{v ?? 0}</span>,
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              EXAM_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
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
    const items = [{ label: 'View Details', value: 'view', icon: Eye }];
    items.push({ label: 'Manage Subjects', value: 'subjects', icon: ListChecks });
    if (canEnterMarks) items.push({ label: 'Enter Marks', value: 'marks', icon: Pencil });
    if (canViewMarks)
      items.push({ label: 'Section Summary', value: 'summary', icon: BarChart3 });
    if (canUpdate && row.status !== 'published')
      items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canPublish) {
      items.push(
        row.status === 'published'
          ? { label: 'Unpublish', value: 'unpublish', icon: RotateCcw }
          : { label: 'Publish', value: 'publish', icon: Send },
      );
    }
    if (canDelete && row.status !== 'published')
      items.push({ label: 'Delete', value: 'delete', icon: Trash2 });
    return items;
  };

  const queryKey = [
    'exams',
    page,
    limit,
    search,
    classId,
    examType,
    status,
    academicYear,
    branchId,
    isActive,
    isOrgLevel,
    userBranchId,
  ];

  const { data, isError, error, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (classId) params.classId = classId;
      if (examType) params.type = examType;
      if (status) params.status = status;
      if (academicYear) params.academicYear = academicYear;
      if (isActive !== '') params.isActive = isActive === 'true';
      return fetchData({ url: '/exam/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  useEffect(() => {
    if (!isError) return;
    const msg = error?.response?.data?.message || error?.message || 'Failed to load exams';
    toast.error(msg);
  }, [isError, error]);

  const exams = data?.data || [];
  const filtered = search
    ? exams.filter((e) => e.name?.toLowerCase().includes(search.toLowerCase()))
    : exams;
  const hasActiveFilters = !!(
    search || classId || examType || status || branchId ||
    academicYear !== defaultAcademicYear || isActive !== 'true'
  );
  const showEmptyState = !isLoading && !isError && filtered.length === 0;

  const handleRowAction = (action, row) => {
    if (action === 'view') router.push(`/dashboard/school/exams/${row._id}`);
    if (action === 'subjects') router.push(`/dashboard/school/exams/${row._id}`);
    if (action === 'marks') router.push(`/dashboard/school/exams/${row._id}/marks`);
    if (action === 'summary') router.push(`/dashboard/school/exams/${row._id}/section-summary`);
    if (action === 'edit') setEditExam(row);
    if (action === 'publish') setPublishTarget({ id: row._id, name: row.name, publish: true });
    if (action === 'unpublish')
      setPublishTarget({ id: row._id, name: row.name, publish: false });
    if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Exam
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2">
            <input
              type="text"
              placeholder="Search by name..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
              className="outline-none text-sm w-56 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2">
            <input
              type="text"
              placeholder="2025-2026"
              value={draftAcademicYear}
              onChange={(e) => setDraftAcademicYear(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
              className="outline-none text-sm w-24 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          <select
            value={draftClassId}
            onChange={(e) => setDraftClassId(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.grade ? `(Gr ${c.grade})` : ''}
              </option>
            ))}
          </select>

          <select
            value={draftExamType}
            onChange={(e) => setDraftExamType(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Types</option>
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>

          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Status</option>
            {EXAM_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>

          <select
            value={draftIsActive}
            onChange={(e) => setDraftIsActive(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>

          {isOrgLevel && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setDraftBranchId(e.target.value)}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={applyFilters}
            className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        {showEmptyState ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Inbox className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            {isTeacherMode && !hasActiveFilters ? (
              <>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                  No exams visible for your account
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Aap kisi class ke liye assigned nahi hain. Apne admin se rabta karein.
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                  No exams found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {hasActiveFilters
                    ? 'Try adjusting filters or clearing them.'
                    : 'There are no exams to show yet.'}
                </p>
              </>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filtered}
            rowActions={rowActions}
            onRowAction={handleRowAction}
            showImage={false}
            visibleColumns={visibleColumns}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            totalItems={data?.total}
          />
        )}

        <AddExamModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => setIsAddOpen(false)}
        />

        <EditExamModal
          isOpen={!!editExam}
          onClose={() => setEditExam(null)}
          onSuccess={() => setEditExam(null)}
          exam={editExam}
        />

        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Exam"
          message={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.name}"? This sets the exam to inactive.`
              : ''
          }
          confirmLabel="Delete"
          confirmTone="danger"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        />

        <ConfirmModal
          isOpen={!!publishTarget}
          onClose={() => setPublishTarget(null)}
          title={publishTarget?.publish ? 'Publish Exam Results' : 'Unpublish Exam Results'}
          message={
            publishTarget
              ? publishTarget.publish
                ? `Publish results for "${publishTarget.name}"? Once published, marks cannot be edited until you unpublish.`
                : `Unpublish "${publishTarget.name}"? Results will become editable again.`
              : ''
          }
          confirmLabel={publishTarget?.publish ? 'Publish' : 'Unpublish'}
          confirmTone={publishTarget?.publish ? 'primary' : 'warning'}
          loading={publishMutation.isPending}
          onConfirm={() =>
            publishMutation.mutate({
              id: publishTarget.id,
              publish: publishTarget.publish,
            })
          }
        />
      </div>
    </div>
  );
}
