'use client';
import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Eye, Check, XCircle, Ban, AlertTriangle, X } from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { canActInBranch } from '@/utils/permissions';
import { useTokenStore } from '@/store/tokenStore';
import {
  LEAVE_STATUSES,
  applicantDetail,
  applicantName,
  buildLeaveListParams,
  formatLeaveRange,
  leaveRowActions,
  requestedByLabel,
} from '@/utils/leave';
import {
  StatusBadge,
  PaySplit,
  leaveTypeLabel,
  inputCls,
  labelCls,
  cardCls,
  secondaryBtn,
} from './leaveShared';
import { BranchSelect, StaffSelect, ClassSectionSelect } from './LeavePickers';
import LeaveDetailModal from './LeaveDetailModal';
import LeaveActionModal from './LeaveActionModal';

const EMPTY = {
  applicantType: '',
  status: 'pending',
  branchId: '',
  from: '',
  to: '',
  staffId: '',
  classId: '',
  sectionId: '',
};

const ACTION_META = {
  view: { label: 'View Details', icon: Eye },
  approve: { label: 'Approve', icon: Check },
  reject: { label: 'Reject', icon: XCircle, danger: true },
  cancel: { label: 'Cancel', icon: Ban, danger: true },
};

const COLUMNS = [
  'applicant',
  'applicantType',
  'leaveType',
  'dates',
  'days',
  'pay',
  'status',
  'requestedBy',
];

export default function RequestsPanel({ role, orgTier, userBranchId }) {
  const { accessToken: token } = useTokenStore();
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [detailId, setDetailId] = useState(null);
  const [action, setAction] = useState(null); // { mode, request }
  const [warnings, setWarnings] = useState([]);

  const setFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const params = useMemo(() => buildLeaveListParams(filters), [filters]);
  const { data, isLoading, error } = useQuery({
    queryKey: ['leave-requests', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/leave', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const classBranchId = orgTier ? filters.branchId : userBranchId;

  const columns = [
    {
      header: 'Applicant',
      accessor: 'applicant',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {applicantName(r)}
          </div>
          {applicantDetail(r) && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{applicantDetail(r)}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Who',
      accessor: 'applicantType',
      render: (v) => (
        <span className="text-sm capitalize text-gray-700 dark:text-gray-300">{v}</span>
      ),
    },
    {
      header: 'Type',
      accessor: 'leaveType',
      render: (v) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{leaveTypeLabel(v)}</span>
      ),
    },
    {
      header: 'Dates',
      accessor: 'dates',
      render: (_, r) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatLeaveRange(r.fromDate, r.toDate)}
        </span>
      ),
    },
    {
      header: 'Days',
      accessor: 'days',
      render: (v) => <span className="text-sm text-gray-700 dark:text-gray-300">{v ?? '—'}</span>,
    },
    { header: 'Paid', accessor: 'pay', render: (_, r) => <PaySplit request={r} /> },
    { header: 'Status', accessor: 'status', render: (v) => <StatusBadge status={v} /> },
    {
      header: 'Requested by',
      accessor: 'requestedBy',
      render: (_, r) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{requestedByLabel(r)}</span>
      ),
    },
  ];

  const rowActions = (r) =>
    leaveRowActions(r, {
      canApprove: canActInBranch(role, 'approve-leave', userBranchId, r.branchId),
    }).map((value) => ({ value, ...ACTION_META[value] }));

  const onRowAction = (value, r) => {
    if (value === 'view') setDetailId(r._id);
    else setAction({ mode: value, request: r });
  };

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Applicant</label>
            <select
              value={filters.applicantType}
              onChange={(e) =>
                setFilter({
                  applicantType: e.target.value,
                  staffId: '',
                  classId: '',
                  sectionId: '',
                })
              }
              className={inputCls}
            >
              <option value="">Staff & students</option>
              <option value="staff">Staff</option>
              <option value="student">Students</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilter({ status: e.target.value })}
              className={`${inputCls} capitalize`}
            >
              <option value="">All statuses</option>
              {LEAVE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {orgTier && (
            <div>
              <label className={labelCls}>Branch</label>
              <BranchSelect
                value={filters.branchId}
                onChange={(v) =>
                  setFilter({ branchId: v, staffId: '', classId: '', sectionId: '' })
                }
                allLabel="All branches"
              />
            </div>
          )}
          <div>
            <label className={labelCls}>From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilter({ from: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => setFilter({ to: e.target.value })}
              className={inputCls}
            />
          </div>
          {filters.applicantType === 'staff' && (
            <div>
              <label className={labelCls}>Staff member</label>
              <StaffSelect
                value={filters.staffId}
                onChange={(v) => setFilter({ staffId: v })}
                branchId={orgTier ? filters.branchId : ''}
                placeholder="All staff"
              />
            </div>
          )}
          {filters.applicantType === 'student' && (
            <div className="sm:col-span-2 grid grid-cols-2 gap-3">
              <div className="col-span-2 -mb-2">
                <label className={labelCls}>Class / section</label>
              </div>
              <ClassSectionSelect
                branchId={classBranchId}
                classId={filters.classId}
                sectionId={filters.sectionId}
                onChange={(v) => setFilter(v)}
              />
            </div>
          )}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFilters(EMPTY);
              setPage(1);
            }}
            className={`${secondaryBtn} mt-3`}
          >
            <X className="w-4 h-4" />
            Reset filters
          </button>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <ul className="flex-1 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setWarnings([])} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error ? (
        <QueryErrorState error={error} fallback="Could not load leave requests" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={COLUMNS}
          rowActions={rowActions}
          onRowAction={onRowAction}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <LeaveDetailModal requestId={detailId} onClose={() => setDetailId(null)} />
      {action && (
        <LeaveActionModal
          mode={action.mode}
          request={action.request}
          onClose={() => setAction(null)}
          onWarnings={setWarnings}
        />
      )}
    </div>
  );
}
