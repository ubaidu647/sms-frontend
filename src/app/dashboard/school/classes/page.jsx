'use client';
import React, { useState, useMemo } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Eye, Edit, Power, LayoutList } from 'lucide-react';
import AddClassModal from './AddClassModal';
import EditClassModal from './EditClassModal';
import ClassDetailModal from './ClassDetailModal';
import SectionsModal from './SectionsModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, patchData } from '@/utils/api';
import toast from 'react-hot-toast';

const GRADES      = ['nursery','kg-1','kg-2','1','2','3','4','5','6','7','8','9','10','11','12'];
const CLASS_TYPES = ['pre-primary','primary','middle','secondary','higher-secondary'];
const MEDIUMS     = ['english','urdu','arabic','other'];

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export default function ClassesPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [isAddOpen,      setIsAddOpen]      = useState(false);
  const [editClass,      setEditClass]      = useState(null);
  const [detailClassId,  setDetailClassId]  = useState(null);
  const [sectionsClass,  setSectionsClass]  = useState(null);

  // Pagination
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters
  const [grade,        setGrade]        = useState('');
  const [classType,    setClassType]    = useState('');
  const [medium,       setMedium]       = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId,     setBranchId]     = useState('');
  const [isActive,     setIsActive]     = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  // RBAC
  const actions  = user?.role?.actions || [];
  const isAdmin  = !!user?.role?.isPredefined;
  const canCreate = isAdmin || actions.includes('create-class') || actions.includes('create-all-branch-class');
  const canUpdate = isAdmin || actions.includes('update-class') || actions.includes('update-all-branch-class');
  const canToggle = isAdmin || actions.includes('delete-class') || actions.includes('delete-all-branch-class');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-class');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const toggleMutation = useMutation({
    mutationFn: (id) => patchData({ url: `/class/${id}/toggle-status`, token }),
    onSuccess: (res, id) => {
      queryClient.setQueriesData({ queryKey: ['classes'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((c) =>
            c._id === id ? { ...c, isActive: res.data.isActive, status: res.data.status } : c,
          ),
        };
      });
      const msg = res?.data?.isActive ? 'Class activated' : 'Class deactivated';
      toast.success(msg);
    },
    onError: (err) => toast.error(err.message || 'Failed to toggle status'),
  });

  const columns = useMemo(() => [
    {
      header: 'Class',
      accessor: 'name',
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-900">{v}</div>
          <div className="text-xs text-gray-400">{row.serialNumber}</div>
        </div>
      ),
    },
    {
      header: 'Grade',
      accessor: 'grade',
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{v}</span>
      ),
    },
    {
      header: 'Type',
      accessor: 'classType',
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">{v}</span>
      ),
    },
    {
      header: 'Medium',
      accessor: 'medium',
      render: (v) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 capitalize">{v}</span>
      ),
    },
    {
      header: 'Year',
      accessor: 'academicYear',
      render: (v) => <div className="text-gray-600 text-sm">{v}</div>,
    },
    {
      header: 'Sections',
      accessor: 'sectionCount',
      render: (v) => <div className="text-gray-700 text-sm font-medium">{v ?? 0}</div>,
    },
    {
      header: 'Capacity',
      accessor: 'totalCapacity',
      render: (v) => <div className="text-gray-600 text-sm">{v ?? '—'}</div>,
    },
    ...(isOrgLevel ? [{
      header: 'Branch',
      accessor: 'branch',
      render: (v) => <div className="text-gray-600 text-sm">{v?.name ?? '—'}</div>,
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
  ], [isOrgLevel]);

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [
      { label: 'View Details', value: 'view',     icon: Eye },
      { label: 'Sections',     value: 'sections', icon: LayoutList },
    ];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canToggle) items.push(
      row.isActive
        ? { label: 'Deactivate', value: 'toggle', icon: Power }
        : { label: 'Activate',   value: 'toggle', icon: Power },
    );
    return items;
  };

  const queryKey = ['classes', page, limit, grade, classType, medium, academicYear, branchId, isActive, isOrgLevel, userBranchId];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (grade)        params.grade        = grade;
      if (classType)    params.classType    = classType;
      if (medium)       params.medium       = medium;
      if (academicYear) params.academicYear = academicYear;
      if (isActive !== '') params.isActive  = isActive;
      return fetchData({ url: '/class/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const classes = data?.data || [];
  const resetPage = () => setPage(1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
            <p className="text-gray-600 mt-1">Manage classes and their sections</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Class
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {/* Academic year */}
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="2025-2026"
              value={academicYear}
              onChange={(e) => { setAcademicYear(e.target.value); resetPage(); }}
              className="outline-none text-sm w-24 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Status */}
          <select
            value={isActive}
            onChange={(e) => { setIsActive(e.target.value); resetPage(); }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>

          {/* Grade */}
          <select
            value={grade}
            onChange={(e) => { setGrade(e.target.value); resetPage(); }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All Grades</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>

          {/* Class type */}
          <select
            value={classType}
            onChange={(e) => { setClassType(e.target.value); resetPage(); }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 capitalize"
          >
            <option value="">All Types</option>
            {CLASS_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>

          {/* Medium */}
          <select
            value={medium}
            onChange={(e) => { setMedium(e.target.value); resetPage(); }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All Mediums</option>
            {MEDIUMS.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
          </select>

          {/* Branch — org-level only */}
          {isOrgLevel && (
            <select
              value={branchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => { setBranchId(e.target.value); resetPage(); }}
              className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          )}
        </div>

        <Table
          columns={columns}
          data={classes}
          rowActions={rowActions}
          onRowAction={(action, row) => {
            if (action === 'view')     setDetailClassId(row._id);
            if (action === 'sections') setSectionsClass(row);
            if (action === 'edit')     setEditClass(row);
            if (action === 'toggle')   toggleMutation.mutate(row._id);
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
        <AddClassModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => setIsAddOpen(false)}
        />

        <EditClassModal
          isOpen={!!editClass}
          onClose={() => setEditClass(null)}
          onSuccess={() => setEditClass(null)}
          cls={editClass}
        />

        <ClassDetailModal
          isOpen={!!detailClassId}
          onClose={() => setDetailClassId(null)}
          classId={detailClassId}
        />

        <SectionsModal
          isOpen={!!sectionsClass}
          onClose={() => setSectionsClass(null)}
          cls={sectionsClass}
        />
      </div>
    </div>
  );
}
