'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, deleteData } from '@/utils/api';
import toast from 'react-hot-toast';
import StructureFormModal from './StructureFormModal';
import ConfirmModal from '../../fees/ConfirmModal';
import { formatMoney, formatDate } from '@/constants/staffSalary';
import { resolveScope, hasAnyAction } from '@/utils/permissions';
import { useTranslations } from 'next-intl';

export default function StructuresPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('salaryStructures');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [staffId, setStaffId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const scope = resolveScope(user?.role, 'view-staff-salary');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  // Self-scoped users can never create / edit / delete structures.
  const canCreate =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['create-staff-salary', 'create-all-branch-staff-salary']);
  const canUpdate =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['update-staff-salary', 'update-all-branch-staff-salary']);
  const canDelete =
    !isOwnOnly &&
    hasAnyAction(user?.role, ['delete-staff-salary', 'delete-all-branch-staff-salary']);
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: staffData } = useQuery({
    queryKey: ['staff-dropdown', effectiveBranchId],
    queryFn: () => {
      const params = { page: 1, limit: 500, token };
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      return fetchData({ url: '/staff/list', ...params });
    },
    enabled: !!token && !isOwnOnly,
    staleTime: 60000,
  });
  const staffList = staffData?.data || [];

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/staff-salary/structure/${id}`, token }),
    onSuccess: () => {
      toast.success('Structure deactivated');
      queryClient.invalidateQueries({ queryKey: ['staff-salary-structures'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to deactivate'),
  });

  const queryKey = [
    'staff-salary-structures',
    page,
    limit,
    staffId,
    branchId,
    isActive,
    isOrgLevel,
    userBranchId,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: () => {
      // Own-scope: use the dedicated staff endpoint and wrap the response so
      // the table renders the same as the branch list.
      if (isOwnOnly) {
        return fetchData({
          url: `/staff-salary/structure/staff/${user.staffId}`,
          token,
        }).then((res) => {
          const rows = Array.isArray(res?.data) ? res.data : res?.data ? [res.data] : [];
          return { data: rows, total: rows.length };
        });
      }
      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (staffId) params.staffId = staffId;
      if (isActive !== '') params.isActive = isActive;
      return fetchData({
        url: '/staff-salary/structure',
        page,
        limit,
        token,
        ...params,
      });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user && (!isOwnOnly || !!user?.staffId),
  });

  const list = data?.data || [];
  const resetPage = () => setPage(1);

  const columns = useMemo(
    () => [
      {
        header: 'Staff',
        accessor: 'staffId',
        render: (v) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
              {v?.userId?.name || v?.user?.name || v?.name || '—'}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {v?.employeeId || v?.serialNumber || ''}
            </div>
          </div>
        ),
      },
      {
        header: 'Basic',
        accessor: 'basicSalary',
        render: (v, row) => (
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatMoney(v, row.currency)}
          </span>
        ),
      },
      {
        header: 'Allowances',
        accessor: 'allowances',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{(v || []).length}</span>
        ),
      },
      {
        header: 'Deductions',
        accessor: 'deductions',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{(v || []).length}</span>
        ),
      },
      {
        header: 'Effective',
        accessor: 'effectiveFrom',
        render: (v, row) => (
          <div className="text-xs text-gray-700 dark:text-gray-300">
            <div>{formatDate(v)}</div>
            {row.effectiveTo && (
              <div className="text-gray-400 dark:text-gray-500">
                to {formatDate(row.effectiveTo)}
              </div>
            )}
          </div>
        ),
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
            {v ? 'Active' : 'Closed'}
          </span>
        ),
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [];
    if (canUpdate && row.isActive) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete && row.isActive)
      items.push({ label: 'Deactivate', value: 'delete', icon: Trash2 });
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
              New Structure
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {!isOwnOnly && (
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                resetPage();
              }}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 min-w-[200px]"
            >
              <option value="">All Staff</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.user?.name || s.userId?.name || s.serialNumber || s.employeeId}
                </option>
              ))}
            </select>
          )}

          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              resetPage();
            }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="true">Active</option>
            <option value="false">Closed</option>
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

        <StructureFormModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
        <StructureFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          structure={editTarget}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Deactivate Salary Structure"
          message={
            deleteTarget
              ? `Deactivate this structure for ${
                  deleteTarget.staffId?.userId?.name ||
                  deleteTarget.staffId?.user?.name ||
                  deleteTarget.staffId?.name ||
                  'this staff member'
                }? It will no longer be used for new payslips.`
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
