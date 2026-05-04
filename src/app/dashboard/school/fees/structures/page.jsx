'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { fetchData, deleteData } from '@/utils/api';
import toast from 'react-hot-toast';
import FeeStructureFormModal from './FeeStructureFormModal';
import StructureDetailModal from './StructureDetailModal';
import ConfirmModal from '../ConfirmModal';
import { currentAcademicYear, formatMoney } from '@/constants/fee';

export default function FeeStructuresPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canCreate =
    isAdmin || actions.includes('create-fee') || actions.includes('create-all-branch-fee');
  const canUpdate =
    isAdmin || actions.includes('update-fee') || actions.includes('update-all-branch-fee');
  const canDelete =
    isAdmin || actions.includes('delete-fee') || actions.includes('delete-all-branch-fee');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-fee');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', effectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: effectiveBranchId || undefined,
        academicYear,
      }),
    enabled: !!token && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/fee/structure/${id}`, token }),
    onSuccess: () => {
      toast.success('Fee structure deactivated');
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete'),
  });

  const queryKey = [
    'fee-structures',
    page,
    limit,
    classId,
    academicYear,
    branchId,
    isActive,
    isOrgLevel,
    userBranchId,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: () => {
      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (classId) params.classId = classId;
      if (academicYear) params.academicYear = academicYear;
      if (isActive !== '') params.isActive = isActive === 'true';
      return fetchData({ url: '/fee/structure/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];
  const filtered = search
    ? list.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()))
    : list;
  const resetPage = () => setPage(1);

  const columns = useMemo(
    () => [
      {
        header: 'Structure',
        accessor: 'name',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900">{v}</div>
            <div className="text-xs text-gray-400">{row.serialNumber}</div>
          </div>
        ),
      },
      {
        header: 'Class',
        accessor: 'class',
        render: (v) => (
          <div className="text-sm text-gray-700">
            {v?.name ?? '—'}
            {v?.grade && <span className="text-xs text-gray-400 ml-1">(Gr {v.grade})</span>}
          </div>
        ),
      },
      {
        header: 'Year',
        accessor: 'academicYear',
        render: (v) => <span className="text-sm text-gray-600">{v}</span>,
      },
      {
        header: 'Components',
        accessor: 'components',
        render: (v) => <span className="text-sm text-gray-700">{(v || []).length}</span>,
      },
      {
        header: 'Monthly Total',
        accessor: 'totalMonthly',
        render: (v) => <span className="text-sm font-medium text-teal-700">{formatMoney(v)}</span>,
      },
      {
        header: 'Due Day',
        accessor: 'defaultDueDay',
        render: (v) => <span className="text-sm text-gray-700">{v ?? '—'}</span>,
      },
      {
        header: 'Status',
        accessor: 'isActive',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              v ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
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
    const items = [{ label: 'View', value: 'view', icon: Eye }];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete && row.isActive)
      items.push({ label: 'Deactivate', value: 'delete', icon: Trash2 });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'view') setViewTarget(row);
    if (action === 'edit') setEditTarget(row);
    if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fee Structures</h1>
            <p className="text-gray-600 mt-1">
              One structure per class per academic year. Define monthly, one-time, annual, and
              quarterly components.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Structure
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="outline-none text-sm w-56 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <input
            type="text"
            placeholder="2025-2026"
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 w-32 outline-none"
          />

          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.grade ? `(Gr ${c.grade})` : ''}
              </option>
            ))}
          </select>

          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>

          {isOrgLevel && (
            <select
              value={branchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => {
                setBranchId(e.target.value);
                resetPage();
              }}
              className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

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

        <FeeStructureFormModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
        />
        <FeeStructureFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          structure={editTarget}
        />
        <StructureDetailModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          structureId={viewTarget?._id}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Deactivate Fee Structure"
          message={
            deleteTarget
              ? `Deactivate "${deleteTarget.name}"? This is a soft delete; existing vouchers stay intact.`
              : ''
          }
          confirmLabel="Deactivate"
          confirmTone="danger"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        />
      </div>
    </div>
  );
}
