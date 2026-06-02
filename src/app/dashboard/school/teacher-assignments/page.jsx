'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Eye, Edit, Trash2, Star, Users, X } from 'lucide-react';
import AddAssignmentModal from './AddAssignmentModal';
import EditAssignmentModal from './EditAssignmentModal';
import AssignmentDetailModal from './AssignmentDetailModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, deleteData } from '@/utils/api';
import toast from 'react-hot-toast';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import { useTranslations } from 'next-intl';

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export default function TeacherAssignmentsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('teacherAssignments');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addMode, setAddMode] = useState('single');
  const [editAssignment, setEditAssignment] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters — draft state holds in-progress UI values; applied state drives the list query.
  const [draftAcademicYear, setDraftAcademicYear] = useState(currentAcademicYear());
  const [draftClassId, setDraftClassId] = useState('');
  const [draftSectionId, setDraftSectionId] = useState('');
  const [draftSubjectId, setDraftSubjectId] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [draftIsPrimary, setDraftIsPrimary] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('true');
  const [draftStaffSearch, setDraftStaffSearch] = useState('');

  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [staffId, _setStaffId] = useState('');
  const [role, setRole] = useState('');
  const [isPrimary, setIsPrimary] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [staffSearch, setStaffSearch] = useState('');

  const applyFilters = () => {
    setAcademicYear(draftAcademicYear);
    setClassId(draftClassId);
    setSectionId(draftSectionId);
    setSubjectId(draftSubjectId);
    setRole(draftRole);
    setIsPrimary(draftIsPrimary);
    setBranchId(draftBranchId);
    setIsActive(draftIsActive);
    setStaffSearch(draftStaffSearch);
    setPage(1);
  };

  const clearFilters = () => {
    const ay = currentAcademicYear();
    setDraftAcademicYear(ay);
    setDraftClassId('');
    setDraftSectionId('');
    setDraftSubjectId('');
    setDraftRole('');
    setDraftIsPrimary('');
    setDraftBranchId('');
    setDraftIsActive('true');
    setDraftStaffSearch('');
    setAcademicYear(ay);
    setClassId('');
    setSectionId('');
    setSubjectId('');
    setRole('');
    setIsPrimary('');
    setBranchId('');
    setIsActive('true');
    setStaffSearch('');
    setPage(1);
  };

  // RBAC
  const scope = resolveScope(user?.role, 'view-teaching-assignment');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canCreate =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'create-teaching-assignment',
      'create-all-branch-teaching-assignment',
    ]);
  const canUpdate =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'update-teaching-assignment',
      'update-all-branch-teaching-assignment',
    ]);
  const canDelete =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'delete-teaching-assignment',
      'delete-all-branch-teaching-assignment',
    ]);
  const canActOnAllBranches = hasAnyAction(user?.role, ['delete-all-branch-teaching-assignment']);
  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Branch dropdown for org-level
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);
  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const draftEffectiveBranchId = isOrgLevel ? draftBranchId : userBranchId;

  // Classes — cascade off draftBranchId + draftAcademicYear for instant dropdown refresh.
  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', draftEffectiveBranchId, draftAcademicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: draftEffectiveBranchId || undefined,
        academicYear: draftAcademicYear,
      }),
    enabled: !!token && !!draftAcademicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  // Sections — driven by draftClassId.
  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', draftClassId],
    queryFn: () => fetchData({ url: `/class/${draftClassId}/sections`, token }),
    enabled: !!token && !!draftClassId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  // Subjects — driven by draftClassId + draftAcademicYear.
  const { data: subjectData } = useQuery({
    queryKey: ['subjects-dropdown', draftClassId, draftAcademicYear],
    queryFn: () =>
      fetchData({
        url: '/subject/list',
        page: 1,
        limit: 200,
        token,
        classId: draftClassId,
        academicYear: draftAcademicYear,
      }),
    enabled: !!token && !!draftClassId,
    staleTime: 60000,
  });
  const subjects = subjectData?.data || [];

  // Reset cascading filters on the draft side.
  useEffect(() => {
    setDraftClassId('');
    setDraftSectionId('');
    setDraftSubjectId('');
  }, [draftAcademicYear, draftBranchId]);
  useEffect(() => {
    setDraftSectionId('');
    setDraftSubjectId('');
  }, [draftClassId]);

  const columns = useMemo(
    () => [
      {
        header: 'Teacher',
        accessor: 'staff',
        render: (v) => {
          const name = v?.user?.name || '';
          const initials =
            name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0]?.toUpperCase())
              .join('') || '?';
          return (
            <div className="flex items-center gap-3">
              {v?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={v.photo}
                  alt={name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 dark:text-teal-400 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                  {name}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {v?.designation}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: 'Subject',
        accessor: 'subject',
        render: (v) => (
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {v?.name || '—'}
            </div>
            {v?.code && <div className="text-xs text-gray-400 dark:text-gray-500">{v.code}</div>}
          </div>
        ),
      },
      {
        header: 'Class / Section',
        accessor: 'class',
        render: (_, row) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {row.class?.name || '—'}
            {row.section?.name && (
              <span className="text-gray-400 dark:text-gray-500"> / {row.section.name}</span>
            )}
          </div>
        ),
      },
      {
        header: 'Role',
        accessor: 'role',
        render: (v, row) => (
          <div className="flex flex-wrap items-center gap-1">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                v === 'teacher'
                  ? 'bg-teal-100 text-teal-800'
                  : v === 'co-teacher'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {v}
            </span>
            {row.isPrimary && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Primary
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Year',
        accessor: 'academicYear',
        render: (v) => <div className="text-sm text-gray-600 dark:text-gray-400">{v}</div>,
      },
      {
        header: 'Status',
        accessor: 'isActive',
        render: (v) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {v ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View Details', value: 'view', icon: Eye }];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete) {
      const sameBranch =
        row.staff?.branchId === userBranchId || row.section?.branchId === userBranchId;
      if (canActOnAllBranches || sameBranch) {
        items.push({ label: 'Unassign', value: 'delete', icon: Trash2, danger: true });
      }
    }
    return items;
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/teaching-assignment/${id}`, token }),
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: ['teacher-assignments'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).filter((a) => a._id !== id),
          total: Math.max((old.total || 1) - 1, 0),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Teacher unassigned');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to unassign teacher'),
  });

  const queryKey = [
    'teacher-assignments',
    page,
    limit,
    academicYear,
    classId,
    sectionId,
    subjectId,
    staffId,
    role,
    isPrimary,
    branchId,
    isActive,
    isOrgLevel,
    userBranchId,
    staffSearch,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = {};
      if (!isOrgLevel) {
        params.branchId = userBranchId;
      } else if (branchId) {
        params.branchId = branchId;
      }
      if (academicYear) params.academicYear = academicYear;
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;
      if (subjectId) params.subjectId = subjectId;
      if (staffId) params.staffId = staffId;
      if (role) params.role = role;
      if (isPrimary !== '') params.isPrimary = isPrimary;
      if (isActive !== '') params.isActive = isActive;
      return fetchData({ url: '/teaching-assignment/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const assignments = useMemo(() => data?.data || [], [data]);

  // Filter client-side by staff name search
  const filteredAssignments = useMemo(() => {
    if (!staffSearch.trim()) return assignments;
    const q = staffSearch.toLowerCase();
    return assignments.filter((a) => a.staff?.user?.name?.toLowerCase().includes(q));
  }, [assignments, staffSearch]);

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isOwnOnly ? t('ownTitle') : t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {isOwnOnly ? t('ownSubtitle') : t('subtitle')}
            </p>
          </div>
          {canCreate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-2">
              <button
                onClick={() => {
                  setAddMode('bulk');
                  setIsAddOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 text-teal-700 dark:text-teal-400 border border-teal-300 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
              >
                <Users className="w-5 h-5" />
                Bulk Assign
              </button>
              <button
                onClick={() => {
                  setAddMode('single');
                  setIsAddOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Assign Teacher
              </button>
            </div>
          )}
        </div>

        {/* Filters — inputs bind to draft state; Search applies. */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2 sm:gap-3">
          <select
            value={draftIsActive}
            onChange={(e) => setDraftIsActive(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>

          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Year (2025-2026)"
              value={draftAcademicYear}
              onChange={(e) => setDraftAcademicYear(e.target.value)}
              className="outline-none text-sm w-full lg:w-32 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
            />
          </div>

          {isOrgLevel && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setDraftBranchId(e.target.value)}
              className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={draftClassId}
            onChange={(e) => setDraftClassId(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {draftClassId && (
            <>
              <select
                value={draftSectionId}
                onChange={(e) => setDraftSectionId(e.target.value)}
                className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
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
                className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </>
          )}

          <select
            value={draftRole}
            onChange={(e) => setDraftRole(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Roles</option>
            <option value="teacher">Teacher</option>
            <option value="co-teacher">Co-teacher</option>
            <option value="substitute">Substitute</option>
          </select>

          <select
            value={draftIsPrimary}
            onChange={(e) => setDraftIsPrimary(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">Primary & Co</option>
            <option value="true">Primary only</option>
            <option value="false">Co-teachers only</option>
          </select>

          {!isOwnOnly && (
            <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Teacher name..."
                value={draftStaffSearch}
                onChange={(e) => setDraftStaffSearch(e.target.value)}
                className="outline-none text-sm w-full lg:w-36 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
              />
            </div>
          )}

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
          data={filteredAssignments}
          rowActions={rowActions}
          onRowAction={(action, row) => {
            if (action === 'view') setDetailId(row._id);
            if (action === 'edit') setEditAssignment(row);
            if (action === 'delete') setDeleteTarget(row);
          }}
          showImage={false}
          visibleColumns={visibleColumns}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={data?.total}
        />

        {/* Modals */}
        <AddAssignmentModal
          isOpen={isAddOpen}
          mode={addMode}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => setIsAddOpen(false)}
        />

        <EditAssignmentModal
          isOpen={!!editAssignment}
          onClose={() => setEditAssignment(null)}
          onSuccess={() => setEditAssignment(null)}
          assignment={editAssignment}
        />

        <AssignmentDetailModal
          isOpen={!!detailId}
          onClose={() => setDetailId(null)}
          assignmentId={detailId}
        />

        {/* Delete confirmation */}
        {deleteTarget && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Unassign Teacher
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to unassign{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {deleteTarget.staff?.user?.name}
                  </span>{' '}
                  from{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {deleteTarget.subject?.name}
                  </span>{' '}
                  in{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {deleteTarget.class?.name} / {deleteTarget.section?.name}
                  </span>
                  ?
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(deleteTarget._id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {deleteMutation.isPending ? 'Removing…' : 'Unassign'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
