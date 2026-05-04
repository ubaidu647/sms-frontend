'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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

export default function AssignmentsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [routeId, setRouteId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

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

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: routeData } = useQuery({
    queryKey: ['routes-dropdown', effectiveBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      return fetchData({ url: '/transport/route', ...params });
    },
    enabled: !!token,
    staleTime: 60000,
  });
  const routes = routeData?.data || [];

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicles-dropdown-assign', effectiveBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 200, token };
      if (effectiveBranchId) params.branchId = effectiveBranchId;
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
          a.studentId?.user?.name?.toLowerCase().includes(term) ||
          a.studentId?.admissionNumber?.toLowerCase().includes(term) ||
          a.routeId?.name?.toLowerCase().includes(term) ||
          a.routeId?.code?.toLowerCase().includes(term) ||
          a.stopName?.toLowerCase().includes(term)
        );
      })
    : list;
  const resetPage = () => setPage(1);

  const columns = useMemo(
    () => [
      {
        header: 'Student',
        accessor: 'studentId',
        render: (s) => (
          <div>
            <div className="font-medium text-gray-900">{s?.user?.name || '—'}</div>
            <div className="text-xs text-gray-500">
              {s?.admissionNumber}
              {s?.rollNumber ? ` · Roll ${s.rollNumber}` : ''}
            </div>
          </div>
        ),
      },
      {
        header: 'Route',
        accessor: 'routeId',
        render: (r) => (
          <div className="text-sm text-gray-700">
            {r?.name || '—'}
            {r?.code && <span className="text-gray-400"> · {r.code}</span>}
          </div>
        ),
      },
      {
        header: 'Stop',
        accessor: 'stopName',
        render: (v) => <span className="text-sm text-gray-700">{v}</span>,
      },
      {
        header: 'Vehicle',
        accessor: 'vehicleId',
        render: (v) => (
          <span className="text-sm text-gray-700">{v?.registrationNumber || '—'}</span>
        ),
      },
      {
        header: 'Direction',
        accessor: 'direction',
        render: (v) => (
          <span className="text-sm text-gray-700">
            {ASSIGNMENT_DIRECTION_LABELS[v] || v}
          </span>
        ),
      },
      {
        header: 'Monthly Fee',
        accessor: 'monthlyFee',
        render: (v) => <span className="text-sm font-medium text-teal-700">{formatMoney(v)}</span>,
      },
      {
        header: 'Year',
        accessor: 'academicYear',
        render: (v) => <span className="text-sm text-gray-600">{v}</span>,
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
            <h1 className="text-3xl font-bold text-gray-900">Transport Assignments</h1>
            <p className="text-gray-600 mt-1">
              Students assigned to routes and stops with locked-in monthly fees.
            </p>
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
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search student / route / stop..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="outline-none text-sm w-64 text-gray-900 placeholder:text-gray-400"
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
            value={routeId}
            onChange={(e) => {
              setRouteId(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All Routes</option>
            {routes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} {r.code ? `(${r.code})` : ''}
              </option>
            ))}
          </select>

          <select
            value={vehicleId}
            onChange={(e) => {
              setVehicleId(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.registrationNumber}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 capitalize"
          >
            <option value="">All Status</option>
            {ASSIGNMENT_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
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
              ? `Cancel transport assignment for "${deleteTarget.studentId?.user?.name || 'this student'}"? This sets status to cancelled and ends it today.`
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
