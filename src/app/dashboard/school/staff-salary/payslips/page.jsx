'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import { Plus, Eye, Layers } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import GeneratePayslipModal from './GeneratePayslipModal';
import GenerateBulkModal from './GenerateBulkModal';
import PayslipDetailModal from './PayslipDetailModal';
import {
  PAYSLIP_STATUSES,
  PAYSLIP_STATUS_COLORS,
  formatMonth,
  formatMoney,
  currentMonth,
} from '@/constants/staffSalary';
import { resolveScope, hasAnyAction } from '@/utils/permissions';

export default function PayslipsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [genOpen, setGenOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [staffId, setStaffId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [status, setStatus] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const scope = resolveScope(user?.role, 'view-payslip');
  const isOrgLevel = scope === 'all';
  const isOwnOnly = scope === 'own';
  // Generate / bulk are bulk operations — only branch-level or admin staff get them.
  const canGenerate = hasAnyAction(user?.role, [
    'generate-payslip',
    'generate-all-branch-payslip',
  ]);
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () =>
      fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
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
    // Own-scope users don't need (and may not have access to) the staff list.
    enabled: !!token && !isOwnOnly,
    staleTime: 60000,
  });
  const staffList = staffData?.data || [];

  const queryKey = [
    'payslips',
    page,
    limit,
    staffId,
    branchId,
    month,
    status,
    isOrgLevel,
    userBranchId,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: () => {
      const params = {};
      // Own-scope: backend pins to the user's own payslips. Don't pass branchId/staffId.
      if (!isOwnOnly) {
        if (!isOrgLevel) params.branchId = userBranchId;
        else if (branchId) params.branchId = branchId;
        if (staffId) params.staffId = staffId;
      }
      if (month) params.month = month;
      if (status) params.status = status;
      return fetchData({
        url: '/staff-salary/payslip',
        page,
        limit,
        token,
        ...params,
      });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const list = data?.data || [];
  const resetPage = () => setPage(1);

  const columns = useMemo(
    () => [
      {
        header: 'Serial',
        accessor: 'serialNumber',
        render: (v) => (
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300">{v || '—'}</span>
        ),
      },
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
        header: 'Month',
        accessor: 'month',
        render: (v) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{formatMonth(v)}</span>
        ),
      },
      {
        header: 'Gross',
        accessor: 'gross',
        render: (v, row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {formatMoney(v, row.currency)}
          </span>
        ),
      },
      {
        header: 'Net',
        accessor: 'netSalary',
        render: (v, row) => (
          <span className="text-sm font-bold text-teal-700 dark:text-teal-400">
            {formatMoney(v, row.currency)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              PAYSLIP_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {v}
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
    ],
    [],
  );

  const visibleColumns = useMemo(
    () => columns.map((c) => c.accessor),
    [columns],
  );

  const rowActions = () => [
    { label: 'View Details', value: 'detail', icon: Eye },
  ];

  const handleRowAction = (action, row) => {
    if (action === 'detail') setDetailTarget(row);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payslips</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Generate, edit, and pay monthly payslips for staff.
            </p>
          </div>
          {canGenerate && !isOwnOnly && (
            <div className="flex gap-2">
              <button
                onClick={() => setGenOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Generate Payslip
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Layers className="w-5 h-5" />
                Run Payroll (Bulk)
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              resetPage();
            }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          />

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
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Status</option>
            {PAYSLIP_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
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

        <GeneratePayslipModal
          isOpen={genOpen}
          onClose={() => setGenOpen(false)}
        />
        <GenerateBulkModal
          isOpen={bulkOpen}
          onClose={() => setBulkOpen(false)}
        />
        <PayslipDetailModal
          isOpen={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          payslipId={detailTarget?._id}
        />
      </div>
    </div>
  );
}
