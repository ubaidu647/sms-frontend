'use client';
// All loans with filters; row actions Return / Renew / Lost / Waive / Fine paid.
import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { RotateCcw, RefreshCw, AlertOctagon, BadgeX, Banknote, X } from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { canActInBranch } from '@/utils/permissions';
import { useTokenStore } from '@/store/tokenStore';
import {
  BORROWER_TYPES,
  LOAN_STATUSES,
  buildLoanListParams,
  loanAccession,
  loanBookTitle,
  loanBorrowerName,
  loanRowActions,
  overdueDays,
} from '@/utils/library';
import LoanActionModal from './LoanActionModal';
import {
  FineCell,
  LoanStatusBadge,
  Spinner,
  cardCls,
  fmtDate,
  inputCls,
  labelCls,
  secondaryBtn,
} from './libraryShared';

const EMPTY = { status: '', borrowerType: '', from: '', to: '' };

const ACTION_META = {
  return: { label: 'Return', icon: RotateCcw },
  renew: { label: 'Renew', icon: RefreshCw },
  lost: { label: 'Mark lost', icon: AlertOctagon, danger: true },
  waive: { label: 'Waive fine', icon: BadgeX },
  'fine-paid': { label: 'Fine paid', icon: Banknote },
};

const COLUMNS = ['book', 'borrower', 'issuedAt', 'dueDate', 'returnedAt', 'status', 'fine'];

export default function LoansPanel({ role, userBranchId, branchId }) {
  const { accessToken: token } = useTokenStore();
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [action, setAction] = useState(null); // { mode, loan }

  const setFilter = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const params = useMemo(() => buildLoanListParams({ ...filters, branchId }), [filters, branchId]);
  const { data, isLoading, error } = useQuery({
    queryKey: ['library-loans', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/library/loans', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const columns = [
    {
      header: 'Book',
      accessor: 'book',
      render: (_, r) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {loanBookTitle(r)}
          </div>
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {loanAccession(r)}
          </div>
        </div>
      ),
    },
    {
      header: 'Borrower',
      accessor: 'borrower',
      render: (_, r) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">{loanBorrowerName(r)}</div>
          <div className="text-xs capitalize text-gray-500 dark:text-gray-400">
            {r.borrowerType}
          </div>
        </div>
      ),
    },
    {
      header: 'Issued',
      accessor: 'issuedAt',
      render: (v) => <span className="text-sm">{fmtDate(v)}</span>,
    },
    {
      header: 'Due',
      accessor: 'dueDate',
      render: (v, r) => {
        const od = r.status === 'issued' ? overdueDays(v) : 0;
        return (
          <div className="text-sm">
            {fmtDate(v)}
            {od > 0 && (
              <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                {od} day(s) late
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Returned',
      accessor: 'returnedAt',
      render: (v) => <span className="text-sm">{fmtDate(v)}</span>,
    },
    { header: 'Status', accessor: 'status', render: (_, r) => <LoanStatusBadge loan={r} /> },
    { header: 'Fine', accessor: 'fine', render: (v) => <FineCell fine={v} /> },
  ];

  const rowActions = (r) =>
    loanRowActions(r, {
      canManage: canActInBranch(role, 'manage-library', userBranchId, r.branchId),
    }).map((value) => ({ value, ...ACTION_META[value] }));

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilter({ status: e.target.value })}
              className={`${inputCls} capitalize`}
            >
              <option value="">All statuses</option>
              {LOAN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Borrower</label>
            <select
              value={filters.borrowerType}
              onChange={(e) => setFilter({ borrowerType: e.target.value })}
              className={`${inputCls} capitalize`}
            >
              <option value="">Students & staff</option>
              {BORROWER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Issued from</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilter({ from: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Issued to</label>
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => setFilter({ to: e.target.value })}
              className={inputCls}
            />
          </div>
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

      {error ? (
        <QueryErrorState error={error} fallback="Could not load loans" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={COLUMNS}
          rowActions={rowActions}
          onRowAction={(mode, loan) => setAction({ mode, loan })}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      {action && (
        <LoanActionModal mode={action.mode} loan={action.loan} onClose={() => setAction(null)} />
      )}
    </div>
  );
}
