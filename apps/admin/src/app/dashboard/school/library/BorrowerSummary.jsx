'use client';
// A borrower's library position: limits, open loans (overdue flagged), pending
// fines and (optionally) recent history. GET /library/borrowers/:type/:id.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import {
  isLoanOverdue,
  loanAccession,
  loanBookTitle,
  overdueDays,
  pendingFineTotal,
} from '@/utils/library';
import { FineCell, LoanStatusBadge, Spinner, fmtDate, money, tdCls, thCls } from './libraryShared';

export function useBorrower(type, id) {
  const { accessToken: token } = useTokenStore();
  const query = useQuery({
    queryKey: ['library-borrower', type, id],
    queryFn: () => fetchData({ url: `/library/borrowers/${type}/${id}`, token }),
    enabled: !!token && !!type && !!id,
    retry: retryUnless4xx,
  });
  const d = query.data?.data || {};
  const openLoans = d.openLoans || [];
  return {
    ...query,
    borrower: d.borrower || null,
    limits: d.borrower?.limits || null,
    openLoans,
    history: d.history || [],
    pendingFines: pendingFineTotal(d.pendingFines),
    overdueCount: openLoans.filter((l) => isLoanOverdue({ status: 'issued', ...l })).length,
  };
}

function LoansTable({ loans, empty }) {
  if (!loans.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className={thCls}>Book</th>
            <th className={thCls}>Issued</th>
            <th className={thCls}>Due</th>
            <th className={thCls}>Returned</th>
            <th className={thCls}>Status</th>
            <th className={thCls}>Fine</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {loans.map((l, i) => {
            const loan = { status: 'issued', ...l };
            const od = loan.status === 'issued' ? overdueDays(loan.dueDate) : 0;
            return (
              <tr key={l._id || i}>
                <td className={tdCls}>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {loanBookTitle(loan)}
                  </div>
                  <div className="text-xs text-gray-500">{loanAccession(loan)}</div>
                </td>
                <td className={tdCls}>{fmtDate(loan.issuedAt)}</td>
                <td className={tdCls}>
                  {fmtDate(loan.dueDate)}
                  {od > 0 && (
                    <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                      {od} day(s) overdue
                    </div>
                  )}
                </td>
                <td className={tdCls}>{fmtDate(loan.returnedAt)}</td>
                <td className={tdCls}>
                  <LoanStatusBadge loan={loan} />
                </td>
                <td className={tdCls}>
                  <FineCell fine={loan.fine} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function BorrowerSummary({ type, id, showHistory = false }) {
  const b = useBorrower(type, id);

  if (b.error) return <QueryErrorState error={b.error} fallback="Could not load borrower" />;
  if (b.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  const max = b.limits?.maxBooks;
  const atLimit = max !== undefined && max !== null && b.openLoans.length >= Number(max);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat
          label="Open loans"
          value={`${b.openLoans.length}${max !== undefined && max !== null ? ` / ${max}` : ''}`}
          warn={atLimit}
        />
        <Stat
          label="Loan days"
          value={b.limits?.loanDays !== undefined ? b.limits.loanDays : '—'}
        />
        <Stat label="Overdue" value={b.overdueCount} warn={b.overdueCount > 0} />
        <Stat label="Pending fines" value={money(b.pendingFines)} warn={b.pendingFines > 0} />
      </div>
      {(atLimit || b.overdueCount > 0) && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            {b.overdueCount > 0
              ? 'This borrower has overdue books — a new issue will be refused until they are returned.'
              : 'This borrower has reached the maximum number of books.'}
          </span>
        </div>
      )}
      <div>
        <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
          Current loans
        </h4>
        <LoansTable loans={b.openLoans} empty="No books currently issued." />
      </div>
      {showHistory && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
            History (last 20)
          </h4>
          <LoansTable loans={b.history} empty="No past loans." />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        warn
          ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
      }`}
    >
      <div className="text-[11px] uppercase font-semibold text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}
