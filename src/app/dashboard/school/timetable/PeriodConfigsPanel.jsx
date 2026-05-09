'use client';
import React, { useState, useMemo } from 'react';
import { Table } from '@/component/Table';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchData, deleteData } from '@/utils/api';
import toast from 'react-hot-toast';
import PeriodConfigModal from './PeriodConfigModal';
import ConfirmModal from './ConfirmModal';

export default function PeriodConfigsPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canCreate =
    isAdmin ||
    actions.includes('create-timetable') ||
    actions.includes('create-all-branch-timetable');
  const canUpdate =
    isAdmin ||
    actions.includes('update-timetable') ||
    actions.includes('update-all-branch-timetable');
  const canDelete =
    isAdmin ||
    actions.includes('delete-timetable') ||
    actions.includes('delete-all-branch-timetable');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-timetable');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editConfig, setEditConfig] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [branchId, setBranchId] = useState('');

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: configData, isFetching } = useQuery({
    queryKey: ['period-configs', isOrgLevel ? branchId : userBranchId],
    queryFn: () =>
      fetchData({
        url: '/timetable/period-config/list',
        token,
        branchId: (isOrgLevel ? branchId : userBranchId) || undefined,
        isActive: true,
      }),
    enabled: !!token,
    staleTime: 30000,
  });
  const configs = configData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/timetable/period-config/${id}`, token }),
    onSuccess: () => {
      toast.success('Period config deleted');
      queryClient.invalidateQueries({ queryKey: ['period-configs'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete'),
  });

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: 'name',
        render: (v, row) => (
          <div className="flex items-center gap-2">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{row.serialNumber}</div>
            </div>
            {row.isDefault && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Star className="w-3 h-3" /> Default
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Working Days',
        accessor: 'workingDays',
        render: (v) => (
          <div className="flex flex-wrap gap-1">
            {(v || []).map((d) => (
              <span
                key={d}
                className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase"
              >
                {d}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: 'Periods',
        accessor: 'periodCount',
        render: (_v, row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{(row.periods || []).length}</span>
        ),
      },
      {
        header: 'Daily Range',
        accessor: 'dailyRange',
        render: (_v, row) => {
          const v = row.periods || [];
          if (!v.length) return <span className="text-gray-400 dark:text-gray-500">—</span>;
          return (
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {v[0]?.startTime} → {v[v.length - 1]?.endTime}
            </span>
          );
        },
      },
      ...(isOrgLevel
        ? [
            {
              header: 'Branch',
              accessor: 'branch',
              render: (v) => <div className="text-gray-600 dark:text-gray-400 text-sm">{v?.name ?? '—'}</div>,
            },
          ]
        : []),
    ],
    [isOrgLevel],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [];
    if (canUpdate) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete) items.push({ label: 'Delete', value: 'delete', icon: Trash2 });
    return items;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          {isOrgLevel && (
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
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
        </div>
        {canCreate && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Period Config
          </button>
        )}
      </div>

      {isFetching && (
        <div className="text-xs text-gray-500 dark:text-gray-400">Loading…</div>
      )}

      <Table
        columns={columns}
        data={configs}
        rowActions={rowActions}
        onRowAction={(action, row) => {
          if (action === 'edit') setEditConfig(row);
          if (action === 'delete') setDeleteTarget(row);
        }}
        showImage={false}
        visibleColumns={visibleColumns}
      />

      <PeriodConfigModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => setIsAddOpen(false)}
      />

      <PeriodConfigModal
        isOpen={!!editConfig}
        onClose={() => setEditConfig(null)}
        onSuccess={() => setEditConfig(null)}
        config={editConfig}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Period Config"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? Sections using this config will lose their daily structure.`
            : ''
        }
        confirmLabel="Delete"
        confirmTone="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
