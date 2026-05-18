'use client';
import React, { useState, useMemo } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Eye, Edit, Power, X } from 'lucide-react';
import AddSubjectModal from './AddSubjectModal';
import EditSubjectModal from './EditSubjectModal';
import SubjectDetailModal from './SubjectDetailModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, patchData } from '@/utils/api';
import toast from 'react-hot-toast';
import { SUBJECT_TYPES, SUBJECT_CATEGORIES } from '@/constants/subject';
import { resolveScope } from '@/utils/permissions';
import { useTranslations } from 'next-intl';

export default function SubjectsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const t = useTranslations('subjects');
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSubject, setEditSubject] = useState(null);
  const [detailSubjectId, setDetailSubjectId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters — draft state holds in-progress UI values; applied state drives the API.
  // No auto academicYear filter on initial load, so newly created subjects always
  // appear in the post-create refetch regardless of their class's academic year.
  const [draftSearch, setDraftSearch] = useState('');
  const [draftClassId, setDraftClassId] = useState('');
  const [draftSubjectType, setDraftSubjectType] = useState('');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftAcademicYear, setDraftAcademicYear] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('true');

  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectType, setSubjectType] = useState('');
  const [category, setCategory] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const applyFilters = () => {
    setSearch(draftSearch);
    setClassId(draftClassId);
    setSubjectType(draftSubjectType);
    setCategory(draftCategory);
    setAcademicYear(draftAcademicYear);
    setBranchId(draftBranchId);
    setIsActive(draftIsActive);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setDraftClassId('');
    setDraftSubjectType('');
    setDraftCategory('');
    setDraftAcademicYear('');
    setDraftBranchId('');
    setDraftIsActive('true');
    setSearch('');
    setClassId('');
    setSubjectType('');
    setCategory('');
    setAcademicYear('');
    setBranchId('');
    setIsActive('true');
    setPage(1);
  };

  // RBAC
  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const scope = resolveScope(user?.role, 'view-subject');
  const isOwnOnly = scope === 'own';
  const isOrgLevel = scope === 'all';
  const canCreate = !isOwnOnly && (isAdmin || actions.includes('create-subject') || actions.includes('create-all-branch-subject'));
  const canUpdate = !isOwnOnly && (isAdmin || actions.includes('update-subject') || actions.includes('update-all-branch-subject'));
  const canToggle = !isOwnOnly && (isAdmin || actions.includes('delete-subject') || actions.includes('delete-all-branch-subject'));
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Class dropdown — academicYear uses applied (text avoids keystroke storms);
  // branchId uses draft so picking a branch instantly refreshes class options.
  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', draftBranchId, academicYear],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (academicYear) params.academicYear = academicYear;
      if (isOrgLevel && draftBranchId) params.branchId = draftBranchId;
      else if (!isOrgLevel) params.branchId = userBranchId;
      return fetchData({ url: '/class/list', ...params });
    },
    enabled: !!token,
    staleTime: 30000,
  });
  const classes = classData?.data || [];

  const toggleMutation = useMutation({
    mutationFn: (id) => patchData({ url: `/subject/${id}/toggle-status`, token }),
    onSuccess: (res, id) => {
      queryClient.setQueriesData({ queryKey: ['subjects'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((s) =>
            s._id === id ? { ...s, isActive: res.data.isActive, status: res.data.status } : s,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      const msg = res?.data?.isActive ? 'Subject activated' : 'Subject deactivated';
      toast.success(msg);
    },
    onError: (err) => toast.error(err.message || 'Failed to toggle status'),
  });

  const columns = useMemo(() => [
    {
      header: 'Subject',
      accessor: 'name',
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">{row.serialNumber}</div>
        </div>
      ),
    },
    {
      header: 'Code',
      accessor: 'code',
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">{v}</span>
      ),
    },
    {
      header: 'Class',
      accessor: 'class',
      render: (v) => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {v?.name ?? '—'}
          {v?.grade && <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(Grade {v.grade})</span>}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: 'subjectType',
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">{v}</span>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:text-blue-300 capitalize">{v}</span>
      ),
    },
    {
      header: 'Marks',
      accessor: 'totalMarks',
      render: (v, row) => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <div>{v} <span className="text-gray-400 dark:text-gray-500">total</span></div>
          <div className="text-xs text-gray-400 dark:text-gray-500">Pass: {row.passingMarks}</div>
        </div>
      ),
    },
    ...(isOwnOnly ? [] : [{
      header: 'Teacher',
      accessor: 'teacherInfo',
      render: (v) => <div className="text-gray-700 dark:text-gray-300 text-sm">{v?.user?.name ?? '—'}</div>,
    }]),
    ...(isOrgLevel ? [{
      header: 'Branch',
      accessor: 'branch',
      render: (v) => <div className="text-gray-600 dark:text-gray-400 text-sm">{v?.name ?? '—'}</div>,
    }] : []),
    {
      header: 'Status',
      accessor: 'isActive',
      render: (v) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {v ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ], [isOrgLevel, isOwnOnly]);

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View Details', value: 'view', icon: Eye }];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canToggle) items.push(
      row.isActive
        ? { label: 'Deactivate', value: 'toggle', icon: Power }
        : { label: 'Activate', value: 'toggle', icon: Power },
    );
    return items;
  };

  const queryKey = isOwnOnly
    ? ['subjects-own', page, limit, search, classId, subjectType, category, academicYear, isActive]
    : ['subjects', page, limit, search, classId, subjectType, category, academicYear, branchId, isActive, isOrgLevel, userBranchId];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      if (isOwnOnly) {
        // Server pins staffId to self via view-own-teaching-assignment.
        const res = await fetchData({
          url: '/teaching-assignment/list',
          page: 1,
          limit: 500,
          token,
          academicYear: academicYear || undefined,
          classId: classId || undefined,
          isActive: isActive !== '' ? isActive : undefined,
        });
        const assignments = res?.data || [];
        const seen = new Map();
        for (const a of assignments) {
          const s = a.subject;
          if (!s?._id || seen.has(s._id)) continue;
          seen.set(s._id, {
            _id: s._id,
            name: s.name,
            code: s.code,
            class: a.class || null,
            section: a.section || null,
            subjectType: s.subjectType,
            category: s.category,
            totalMarks: s.totalMarks,
            passingMarks: s.passingMarks,
            isActive: s.isActive ?? a.isActive,
          });
        }
        let derived = Array.from(seen.values());
        if (search.trim()) {
          const q = search.toLowerCase();
          derived = derived.filter(
            (s) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q),
          );
        }
        if (subjectType) derived = derived.filter((s) => s.subjectType === subjectType);
        if (category) derived = derived.filter((s) => s.category === category);
        const start = (page - 1) * limit;
        return { data: derived.slice(start, start + limit), total: derived.length };
      }

      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (search) params.search = search;
      if (classId) params.classId = classId;
      if (subjectType) params.subjectType = subjectType;
      if (category) params.category = category;
      if (academicYear) params.academicYear = academicYear;
      if (isActive !== '') params.isActive = isActive === 'true';
      return fetchData({ url: '/subject/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const subjects = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isOwnOnly ? t('ownTitle') : t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isOwnOnly ? t('ownSubtitle') : t('subtitle')}
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Subject
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2">
            <input
              type="text"
              placeholder="Search by name or code..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
              className="outline-none text-sm w-56 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          {/* Academic year */}
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

          {/* Status */}
          <select
            value={draftIsActive}
            onChange={(e) => setDraftIsActive(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>

          {/* Class */}
          <select
            value={draftClassId}
            onChange={(e) => setDraftClassId(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name} {c.grade ? `(Gr ${c.grade})` : ''}</option>
            ))}
          </select>

          {/* Subject type */}
          <select
            value={draftSubjectType}
            onChange={(e) => setDraftSubjectType(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Types</option>
            {SUBJECT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>

          {/* Category */}
          <select
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Categories</option>
            {SUBJECT_CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>

          {/* Branch — org-level only */}
          {isOrgLevel && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setDraftBranchId(e.target.value)}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
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

        <Table
          columns={columns}
          data={subjects}
          rowActions={rowActions}
          onRowAction={(action, row) => {
            if (action === 'view') setDetailSubjectId(row._id);
            if (action === 'edit') setEditSubject(row);
            if (action === 'toggle') toggleMutation.mutate(row._id);
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
        <AddSubjectModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => setIsAddOpen(false)}
        />

        <EditSubjectModal
          isOpen={!!editSubject}
          onClose={() => setEditSubject(null)}
          onSuccess={() => setEditSubject(null)}
          subject={editSubject}
        />

        <SubjectDetailModal
          isOpen={!!detailSubjectId}
          onClose={() => setDetailSubjectId(null)}
          subjectId={detailSubjectId}
        />
      </div>
    </div>
  );
}
