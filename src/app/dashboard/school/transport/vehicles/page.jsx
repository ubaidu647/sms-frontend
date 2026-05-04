'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react';
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
import VehicleFormModal from './VehicleFormModal';
import VehicleRosterModal from './VehicleRosterModal';
import ConfirmModal from '../ConfirmModal';
import {
  VEHICLE_STATUSES,
  VEHICLE_STATUS_COLORS,
  VEHICLE_TYPES,
} from '@/constants/transport';

export default function VehiclesPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [rosterTarget, setRosterTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canCreate =
    isAdmin || actions.includes('create-vehicle') || actions.includes('create-all-branch-vehicle');
  const canUpdate =
    isAdmin || actions.includes('update-vehicle') || actions.includes('update-all-branch-vehicle');
  const canDelete =
    isAdmin || actions.includes('delete-vehicle') || actions.includes('delete-all-branch-vehicle');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-vehicle');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/transport/vehicle/${id}`, token }),
    onSuccess: () => {
      toast.success('Vehicle retired');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to retire vehicle'),
  });

  const queryKey = [
    'vehicles',
    page,
    limit,
    search,
    vehicleType,
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
      if (vehicleType) params.vehicleType = vehicleType;
      if (status) params.status = status;
      if (search) params.registrationNumber = search;
      if (isActive !== '') params.isActive = isActive;
      return fetchData({ url: '/transport/vehicle', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];
  const resetPage = () => setPage(1);

  const columns = useMemo(
    () => [
      {
        header: 'Registration',
        accessor: 'registrationNumber',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900">{v}</div>
            <div className="text-xs text-gray-400 capitalize">{row.vehicleType}</div>
          </div>
        ),
      },
      {
        header: 'Make / Model',
        accessor: 'make',
        render: (v, row) => (
          <div className="text-sm text-gray-700">
            {v || '—'}
            {row.modelName && <span className="text-gray-400"> · {row.modelName}</span>}
          </div>
        ),
      },
      {
        header: 'Capacity',
        accessor: 'capacity',
        render: (v) => <span className="text-sm text-gray-700">{v}</span>,
      },
      {
        header: 'Driver',
        accessor: 'driver',
        render: (v) => (
          <div>
            <div className="text-sm font-medium text-gray-900">{v?.name || '—'}</div>
            <div className="text-xs text-gray-500">{v?.phone || ''}</div>
          </div>
        ),
      },
      {
        header: 'Branch',
        accessor: 'branchId',
        render: (v) => <span className="text-sm text-gray-600">{v?.name || '—'}</span>,
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              VEHICLE_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
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
    const items = [{ label: 'Roster', value: 'roster', icon: Users }];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete && row.status !== 'retired')
      items.push({ label: 'Retire', value: 'delete', icon: Trash2 });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'roster') setRosterTarget(row);
    if (action === 'edit') setEditTarget(row);
    if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
            <p className="text-gray-600 mt-1">
              Buses, vans and other vehicles available for student transport.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Vehicle
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-gray-200 gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Registration number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="outline-none text-sm w-56 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <select
            value={vehicleType}
            onChange={(e) => {
              setVehicleType(e.target.value);
              resetPage();
            }}
            className="bg-white px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 capitalize"
          >
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
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
            {VEHICLE_STATUSES.map((s) => (
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
          data={list}
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

        <VehicleFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        <VehicleFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          vehicle={editTarget}
        />
        <VehicleRosterModal
          isOpen={!!rosterTarget}
          onClose={() => setRosterTarget(null)}
          vehicleId={rosterTarget?._id}
          vehicleLabel={rosterTarget?.registrationNumber}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Retire Vehicle"
          message={
            deleteTarget
              ? `Retire vehicle "${deleteTarget.registrationNumber}"? This is a soft delete; the vehicle will be marked retired and inactive. The action will fail if it's referenced by an active route or assignment.`
              : ''
          }
          confirmLabel="Retire"
          confirmTone="danger"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        />
      </div>
    </div>
  );
}
