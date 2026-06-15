'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Plus, Search, Edit, Trash2, Users, Eye, X } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, deleteData } from '@/utils/api';
import toast from 'react-hot-toast';
import RouteFormModal from './RouteFormModal';
import RouteRosterModal from './RouteRosterModal';
import RouteDetailModal from './RouteDetailModal';
import ConfirmModal from '../ConfirmModal';
import { ROUTE_STATUSES, ROUTE_STATUS_COLORS } from '@/constants/transport';
import { formatMoney } from '@/constants/fee';
import { useTranslations } from 'next-intl';

export default function RoutesPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('routes');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [rosterTarget, setRosterTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  // Filters — draft state holds in-progress UI values; applied state drives the API.
  const [draftSearch, setDraftSearch] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [draftVehicleId, setDraftVehicleId] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftIsActive, setDraftIsActive] = useState('true');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const applyFilters = () => {
    setSearch(draftSearch);
    setStatus(draftStatus);
    setVehicleId(draftVehicleId);
    setBranchId(draftBranchId);
    setIsActive(draftIsActive);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setDraftStatus('');
    setDraftVehicleId('');
    setDraftBranchId('');
    setDraftIsActive('true');
    setSearch('');
    setStatus('');
    setVehicleId('');
    setBranchId('');
    setIsActive('true');
    setPage(1);
  };

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canCreate =
    isAdmin || actions.includes('create-route') || actions.includes('create-all-branch-route');
  const canUpdate =
    isAdmin || actions.includes('update-route') || actions.includes('update-all-branch-route');
  const canDelete =
    isAdmin || actions.includes('delete-route') || actions.includes('delete-all-branch-route');
  const canViewRoster =
    isAdmin ||
    actions.includes('view-transport-assignment') ||
    actions.includes('view-all-branch-transport-assignment');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-route');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Vehicle dropdown uses draft branchId so picking a branch instantly refreshes options.
  const draftEffectiveBranchId = isOrgLevel ? draftBranchId : userBranchId;

  const { data: vehicleData } = useQuery({
    queryKey: ['vehicles-dropdown', draftEffectiveBranchId],
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
    mutationFn: (id) => deleteData({ url: `/transport/route/${id}`, token }),
    onSuccess: () => {
      toast.success('Route deactivated');
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete route'),
  });

  const queryKey = [
    'routes',
    page,
    limit,
    search,
    status,
    vehicleId,
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
      if (search) params.name = search;
      if (status) params.status = status;
      if (vehicleId) params.vehicleId = vehicleId;
      if (isActive !== '') params.isActive = isActive;
      return fetchData({ url: '/transport/route', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];

  const columns = useMemo(
    () => [
      {
        header: 'Route',
        accessor: 'name',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{row.code || '—'}</div>
          </div>
        ),
      },
      {
        header: 'Path',
        accessor: 'startPoint',
        render: (v, row) => (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {v}
            <span className="text-gray-400 dark:text-gray-500"> → </span>
            {row.endPoint}
          </div>
        ),
      },
      {
        header: 'Vehicle',
        accessor: 'vehicleId',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {v?.registrationNumber || '—'}
          </span>
        ),
      },
      {
        header: 'Stops',
        accessor: 'stops',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{(v || []).length}</span>
        ),
      },
      {
        header: 'Base Fee',
        accessor: 'baseFee',
        render: (v) => (
          <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
            {formatMoney(v)}
          </span>
        ),
      },
      {
        header: 'Branch',
        accessor: 'branchId',
        render: (v) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{v?.name || '—'}</span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              ROUTE_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
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
    items.push({ label: 'View Detail Route', value: 'detail', icon: Eye });
    if (canViewRoster) items.push({ label: 'Roster', value: 'roster', icon: Users });
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete && row.isActive)
      items.push({ label: 'Deactivate', value: 'delete', icon: Trash2 });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'detail') setDetailTarget(row);
    if (action === 'roster') setRosterTarget(row);
    if (action === 'edit') setEditTarget(row);
    if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Route
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
              className="outline-none text-sm w-56 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>

          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Status</option>
            {ROUTE_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
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

        <RouteFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        <RouteFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          route={editTarget}
        />
        <RouteRosterModal
          isOpen={!!rosterTarget}
          onClose={() => setRosterTarget(null)}
          routeId={rosterTarget?._id}
          routeLabel={rosterTarget?.name}
        />
        <RouteDetailModal
          isOpen={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          route={detailTarget}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Deactivate Route"
          message={
            deleteTarget
              ? `Deactivate route "${deleteTarget.name}"? Active student assignments must be removed first.`
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
