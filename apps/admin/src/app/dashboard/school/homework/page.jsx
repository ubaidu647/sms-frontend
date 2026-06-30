'use client';
import React, { useState, useMemo } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, X, Eye, Edit, Send, Archive, Trash2, ClipboardList } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, patchData, deleteData } from '@/utils/api';
import toast from 'react-hot-toast';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import AddHomeworkModal from './AddHomeworkModal';
import EditHomeworkModal from './EditHomeworkModal';
import HomeworkDetailModal from './HomeworkDetailModal';
import SubmissionsModal from './SubmissionsModal';
import { STATUS_STYLES, SUBMISSION_TYPE_LABELS, HOMEWORK_STATUSES } from './constants';

const has = (role, ...keys) => {
  if (role?.isPredefined) return true;
  const actions = role?.actions || [];
  return keys.some((k) => actions.includes(k));
};

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HomeworkPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const role = user?.role;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editHomework, setEditHomework] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [submissionsHw, setSubmissionsHw] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Draft vs applied filters — never bind inputs straight to the query.
  const [draftSearch, setDraftSearch] = useState('');
  const [draftClassId, setDraftClassId] = useState('');
  const [draftSectionId, setDraftSectionId] = useState('');
  const [draftSubjectId, setDraftSubjectId] = useState('');
  const [draftStatus, setDraftStatus] = useState('');

  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState('');

  const applyFilters = () => {
    setSearch(draftSearch);
    setClassId(draftClassId);
    setSectionId(draftSectionId);
    setSubjectId(draftSubjectId);
    setStatus(draftStatus);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setDraftClassId('');
    setDraftSectionId('');
    setDraftSubjectId('');
    setDraftStatus('');
    setSearch('');
    setClassId('');
    setSectionId('');
    setSubjectId('');
    setStatus('');
    setPage(1);
  };

  // RBAC
  const isOrgLevel = role?.isPredefined || has(role, 'view-all-branch-homework');
  const canCreate = has(role, 'create-homework', 'create-all-branch-homework');
  const canUpdate = has(role, 'update-homework', 'update-all-branch-homework');
  const canDelete = has(role, 'delete-homework', 'delete-all-branch-homework');
  const canGrade = has(role, 'grade-homework', 'grade-all-branch-homework');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Class filter options (branch-scoped, no academic-year default so new rows aren't hidden).
  const { data: classData } = useQuery({
    queryKey: ['homework-classes-dropdown', userBranchId, isOrgLevel],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (!isOrgLevel && userBranchId) params.branchId = userBranchId;
      return fetchData({ url: '/class/list', ...params });
    },
    enabled: !!token && !!user,
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['homework-sections-dropdown', draftClassId],
    queryFn: () => fetchData({ url: `/class/${draftClassId}/sections`, token }),
    enabled: !!token && !!draftClassId,
    staleTime: 30000,
  });
  const sections = sectionData?.data || [];

  const { data: subjectData } = useQuery({
    queryKey: ['homework-subjects-dropdown', draftClassId],
    queryFn: () =>
      fetchData({ url: '/subject/list', page: 1, limit: 200, token, classId: draftClassId }),
    enabled: !!token && !!draftClassId,
    staleTime: 30000,
  });
  const subjects = subjectData?.data || [];

  const { data, isFetching } = useQuery({
    queryKey: ['homework', page, limit, search, classId, sectionId, subjectId, status],
    queryFn: () => {
      const params = { page, limit, token };
      if (search) params.search = search;
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;
      if (subjectId) params.subjectId = subjectId;
      if (status) params.status = status;
      return fetchData({ url: '/homework/list', ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const homeworks = data?.data || [];

  const lifecycleMutation = useMutation({
    mutationFn: ({ id, action }) => patchData({ url: `/homework/${id}/${action}`, token }),
    onSuccess: (res, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success(
        res?.message || (action === 'publish' ? 'Homework published' : 'Homework archived'),
      );
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/homework/${id}`, token }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      toast.success(res?.message || 'Homework deleted');
    },
    onError: (err) => toast.error(err.message || 'Failed to delete'),
  });

  const columns = useMemo(
    () => [
      {
        header: 'Title',
        accessor: 'title',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{row.serialNumber}</div>
          </div>
        ),
      },
      {
        header: 'Subject',
        accessor: 'subject',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{v?.name ?? '—'}</span>
        ),
      },
      {
        header: 'Type',
        accessor: 'submissionType',
        render: (v) => (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {SUBMISSION_TYPE_LABELS[v] || v}
          </span>
        ),
      },
      {
        header: 'Due',
        accessor: 'dueDate',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{fmtDate(v)}</span>
        ),
      },
      {
        header: 'Submissions',
        accessor: 'submissionCount',
        render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{v ?? 0}</span>,
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
              STATUS_STYLES[v] || STATUS_STYLES.draft
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
    const items = [
      { label: 'View Details', value: 'view', icon: Eye },
      { label: 'Submissions', value: 'submissions', icon: ClipboardList },
    ];
    if (canUpdate) {
      items.push({ label: 'Edit', value: 'edit', icon: Edit });
      if (row.status === 'draft') items.push({ label: 'Publish', value: 'publish', icon: Send });
      if (row.status !== 'archived')
        items.push({ label: 'Archive', value: 'archive', icon: Archive });
    }
    if (canDelete) items.push({ label: 'Delete', value: 'delete', icon: Trash2 });
    return items;
  };

  const onRowAction = (action, row) => {
    switch (action) {
      case 'view':
        setDetailRow(row);
        break;
      case 'submissions':
        setSubmissionsHw(row);
        break;
      case 'edit':
        setEditHomework(row);
        break;
      case 'publish':
        lifecycleMutation.mutate({ id: row._id, action: 'publish' });
        break;
      case 'archive':
        if (window.confirm(`Archive "${row.title}"? Students will no longer see it.`))
          lifecycleMutation.mutate({ id: row._id, action: 'archive' });
        break;
      case 'delete':
        if (window.confirm(`Delete "${row.title}"? This cannot be undone.`))
          deleteMutation.mutate(row._id);
        break;
      default:
        break;
    }
  };

  const selectCls =
    'w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300';

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Homework
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Assign, publish and grade homework
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Create Homework
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2 sm:gap-3">
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2 col-span-2 sm:col-span-3 md:col-span-2 lg:col-span-1">
            <input
              type="text"
              placeholder="Search title..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="outline-none text-sm w-full lg:w-56 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
            />
          </div>

          <select
            value={draftClassId}
            onChange={(e) => {
              setDraftClassId(e.target.value);
              setDraftSectionId('');
              setDraftSubjectId('');
            }}
            className={selectCls}
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.grade ? `(Gr ${c.grade})` : ''}
              </option>
            ))}
          </select>

          <select
            value={draftSectionId}
            onChange={(e) => setDraftSectionId(e.target.value)}
            disabled={!draftClassId}
            className={selectCls}
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={draftSubjectId}
            onChange={(e) => setDraftSubjectId(e.target.value)}
            disabled={!draftClassId}
            className={selectCls}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
            className={`${selectCls} capitalize`}
          >
            <option value="">All Statuses</option>
            {HOMEWORK_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={applyFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm w-full lg:w-auto"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm w-full lg:w-auto"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        <Table
          columns={columns}
          data={homeworks}
          rowActions={rowActions}
          onRowAction={onRowAction}
          showImage={false}
          visibleColumns={visibleColumns}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={data?.total}
          loading={isFetching}
        />

        {/* Modals */}
        <AddHomeworkModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => setIsAddOpen(false)}
        />
        <EditHomeworkModal
          isOpen={!!editHomework}
          onClose={() => setEditHomework(null)}
          onSuccess={() => setEditHomework(null)}
          homework={editHomework}
        />
        <HomeworkDetailModal
          isOpen={!!detailRow}
          onClose={() => setDetailRow(null)}
          homeworkId={detailRow?._id}
          fallback={detailRow}
          canUpdate={canUpdate}
        />
        <SubmissionsModal
          isOpen={!!submissionsHw}
          onClose={() => setSubmissionsHw(null)}
          homework={submissionsHw}
          canGrade={canGrade}
        />
      </div>
    </div>
  );
}
