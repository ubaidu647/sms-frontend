'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';
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
import AssignmentFormModal from './AssignmentFormModal';
import ConfirmModal from '../ConfirmModal';
import {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_COLORS,
  ASSIGNMENT_DIRECTION_LABELS,
} from '@/constants/transport';
import { currentAcademicYear, formatMoney } from '@/constants/fee';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import { useTranslations } from 'next-intl';

export default function AssignmentsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('transportAssignments');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  // Filters — draft state holds in-progress UI values; applied state drives the API.
  const defaultAcademicYear = currentAcademicYear();
  const [draftSearch, setDraftSearch] = useState('');
  const [draftRouteId, setDraftRouteId] = useState('');
  const [draftVehicleId, setDraftVehicleId] = useState('');
  const [draftAcademicYear, setDraftAcademicYear] = useState(defaultAcademicYear);
  const [draftStatus, setDraftStatus] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('true');

  const [search, setSearch] = useState('');
  const [routeId, setRouteId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const applyFilters = () => {
    setSearch(draftSearch);
    setRouteId(draftRouteId);
    setVehicleId(draftVehicleId);
    setAcademicYear(draftAcademicYear);
    setStatus(draftStatus);
    setBranchId(draftBranchId);
    setIsActive(draftIsActive);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setDraftRouteId('');
    setDraftVehicleId('');
    setDraftAcademicYear(defaultAcademicYear);
    setDraftStatus('');
    setDraftBranchId('');
    setDraftIsActive('true');
    setSearch('');
    setRouteId('');
    setVehicleId('');
    setAcademicYear(defaultAcademicYear);
    setStatus('');
    setBranchId('');
    setIsActive('true');
    setPage(1);
  };

  const scope = resolveScope(user?.role, 'view-transport-assignment');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  const canCreate =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'assign-transport',
      'assign-all-branch-transport',
    ]);
  const canUpdate =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'update-transport-assignment',
      'update-all-branch-transport-assignment',
    ]);
  const canDelete =
    !isOwnOnly &&
    hasAnyAction(user?.role, [
      'remove-transport-assignment',
      'remove-all-branch-transport-assignment',
    ]);
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Dropdown queries: branchId uses draft so picking a branch instantly refreshes options.
  const draftEffectiveBranchId = isOrgLevel ? draftBranchId : userBranchId;

  const { data: routeData } = useQuery({
    queryKey: ['routes-dropdown', draftEffectiveBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (draftEffectiveBranchId) params.branchId = draftEffectiveBranchId;
      return fetchData({ url: '/transport/route', ...params });
    },
    enabled: !!token,
    staleTime: 60000,
  });
  const routes = routeData?.data || [];

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicles-dropdown-assign', draftEffectiveBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (draftEffectiveBranchId) params.branchId = draftEffectiveBranchId;
      return fetchData({ url: '/transport/vehicle', ...params });
    },
    enabled: !!token,
    staleTime: 60000,
  });
  const vehicles = vehicleData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/transport/assignment/${id}`, token }),
    onSuccess: () => {
      toast.success('Assignment cancelled');
      queryClient.invalidateQueries({ queryKey: ['transport-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-roster'] });
      queryClient.invalidateQueries({ queryKey: ['route-roster'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel assignment'),
  });

  const queryKey = [
    'transport-assignments',
    page,
    limit,
    routeId,
    vehicleId,
    academicYear,
    status,
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
      if (routeId) params.routeId = routeId;
      if (vehicleId) params.vehicleId = vehicleId;
      if (academicYear) params.academicYear = academicYear;
      if (status) params.status = status;
      if (isActive !== '') params.isActive = isActive;
      return fetchData({ url: '/transport/assignment', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];
  const filtered = search
    ? list.filter((a) => {
        const term = search.toLowerCase();
        return (
          a.student?.name?.toLowerCase().includes(term) ||
          a.student?.admissionNumber?.toLowerCase().includes(term) ||
          a.route?.name?.toLowerCase().includes(term) ||
          a.route?.code?.toLowerCase().includes(term) ||
          a.stopName?.toLowerCase().includes(term)
        );
      })
    : list;

  const columns = useMemo(
    () => [
      {
        header: 'Student',
        accessor: 'student',
        render: (s) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{s?.name || '—'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {s?.admissionNumber}
              {s?.rollNumber ? ` · Roll ${s.rollNumber}` : ''}
            </div>
          </div>
        ),
      },
      {
        header: 'Route',
        accessor: 'route',
        render: (r) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {r?.name || '—'}
            {r?.code && <span className="text-gray-400 dark:text-gray-500"> · {r.code}</span>}
          </div>
        ),
      },
      {
        header: 'Stop',
        accessor: 'stopName',
        render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{v}</span>,
      },
      {
        header: 'Vehicle',
        accessor: 'vehicle',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{v?.registrationNumber || '—'}</span>
        ),
      },
      {
        header: 'Direction',
        accessor: 'direction',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {ASSIGNMENT_DIRECTION_LABELS[v] || v}
          </span>
        ),
      },
      {
        header: 'Monthly Fee',
        accessor: 'monthlyFee',
        render: (v) => <span className="text-sm font-medium text-teal-700 dark:text-teal-400">{formatMoney(v)}</span>,
      },
      {
        header: 'Year',
        accessor: 'academicYear',
        render: (v) => <span className="text-sm text-gray-600 dark:text-gray-400">{v}</span>,
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              ASSIGNMENT_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
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
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete && row.status !== 'cancelled')
      items.push({ label: 'Cancel', value: 'delete', icon: Trash2 });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'edit') setEditTarget(row);
    if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="p-6">
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
              Assign Student
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2">
            <input
              type="text"
              placeholder="Search student / route / stop..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
              className="outline-none text-sm w-64 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          <input
            type="text"
            placeholder="2025-2026"
            value={draftAcademicYear}
            onChange={(e) => setDraftAcademicYear(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 w-32 outline-none"
          />

          <select
            value={draftRouteId}
            onChange={(e) => setDraftRouteId(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Routes</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} {r.code ? `(${r.code})` : ''}
              </option>
            ))}
          </select>

          <select
            value={draftVehicleId}
            onChange={(e) => setDraftVehicleId(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.registrationNumber}
              </option>
            ))}
          </select>

          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Status</option>
            {ASSIGNMENT_STATUSES.map((s) => (
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

        <AssignmentFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        <AssignmentFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          assignment={editTarget}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Cancel Assignment"
          message={
            deleteTarget
              ? `Cancel transport assignment for "${deleteTarget.student?.name || 'this student'}"? This sets status to cancelled and ends it today.`
              : ''
          }
          confirmLabel="Cancel Assignment"
          confirmTone="danger"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        />
      </div>
    </div>
  );
}
