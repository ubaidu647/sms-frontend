'use client';
// Library at a glance: counts from GET /library/summary + the overdue loans
// with days late and the fine accumulating so far.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Copy,
  CheckCircle2,
  BookUp,
  AlarmClock,
  BookX,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { branchIdOf } from '@/utils/permissions';
import { useTokenStore } from '@/store/tokenStore';
import {
  loanAccession,
  loanBookTitle,
  loanBorrowerName,
  overdueDays,
  previewFine,
} from '@/utils/library';
import {
  Spinner,
  cardCls,
  fmtDate,
  money,
  tdCls,
  thCls,
  useLibrarySettings,
} from './libraryShared';

const CARDS = [
  { key: 'books', label: 'Titles', icon: BookOpen },
  { key: 'copies', label: 'Copies', icon: Copy },
  { key: 'available', label: 'On shelf', icon: CheckCircle2, tone: 'green' },
  { key: 'issued', label: 'Issued', icon: BookUp, tone: 'teal' },
  { key: 'overdue', label: 'Overdue', icon: AlarmClock, tone: 'red' },
  { key: 'lost', label: 'Lost', icon: BookX, tone: 'rose' },
  { key: 'pendingFineTotal', label: 'Pending fines', icon: Wallet, money: true, tone: 'amber' },
  { key: 'issuedToday', label: 'Issued today', icon: ArrowUpFromLine },
  { key: 'returnedToday', label: 'Returned today', icon: ArrowDownToLine },
];

const TONES = {
  green: 'text-green-600 dark:text-green-400',
  teal: 'text-teal-600 dark:text-teal-400',
  red: 'text-red-600 dark:text-red-400',
  rose: 'text-rose-600 dark:text-rose-400',
  amber: 'text-amber-600 dark:text-amber-400',
};

export default function OverviewPanel({ branchId }) {
  const { accessToken: token } = useTokenStore();

  const summary = useQuery({
    queryKey: ['library-summary', branchId || ''],
    queryFn: () => fetchData({ url: '/library/summary', token, ...(branchId ? { branchId } : {}) }),
    enabled: !!token,
  });
  const s = summary.data?.data || {};

  const overdue = useQuery({
    queryKey: [
      'library-loans',
      { status: 'overdue', branchId: branchId || '', page: 1, limit: 50 },
    ],
    queryFn: () =>
      fetchData({
        url: '/library/loans',
        page: 1,
        limit: 50,
        token,
        status: 'overdue',
        ...(branchId ? { branchId } : {}),
      }),
    enabled: !!token,
  });
  const loans = [...(overdue.data?.data || [])].sort(
    (a, b) => overdueDays(b.dueDate) - overdueDays(a.dueDate),
  );

  return (
    <div className="space-y-6">
      {summary.error ? (
        <QueryErrorState error={summary.error} fallback="Could not load the library summary" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CARDS.map(({ key, label, icon: Icon, tone, money: isMoney }) => (
            <div key={key} className={cardCls}>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <Icon className={`w-4 h-4 ${TONES[tone] || ''}`} />
                {label}
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {summary.isLoading ? '…' : isMoney ? money(s[key]) : Number(s[key]) || 0}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Overdue loans
          </h3>
          {overdue.data?.total > loans.length && (
            <span className="text-xs text-gray-500">
              Showing {loans.length} of {overdue.data.total} — see the Loans tab
            </span>
          )}
        </div>
        {overdue.error ? (
          <QueryErrorState error={overdue.error} fallback="Could not load overdue loans" />
        ) : overdue.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : loans.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            No overdue books.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className={thCls}>Book</th>
                  <th className={thCls}>Borrower</th>
                  <th className={thCls}>Due</th>
                  <th className={thCls}>Days overdue</th>
                  <th className={thCls}>Fine so far</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loans.map((l) => (
                  <OverdueRow key={l._id} loan={l} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OverdueRow({ loan }) {
  const { settings } = useLibrarySettings(branchIdOf(loan.branchId));
  const days = overdueDays(loan.dueDate);
  const fine = previewFine({ dueDate: loan.dueDate, returnedAt: localYMD(), settings });
  return (
    <tr>
      <td className={tdCls}>
        <div className="font-medium text-gray-900 dark:text-gray-100">{loanBookTitle(loan)}</div>
        <div className="text-xs font-mono text-gray-500">{loanAccession(loan)}</div>
      </td>
      <td className={tdCls}>
        {loanBorrowerName(loan)}
        <div className="text-xs capitalize text-gray-500">{loan.borrowerType}</div>
      </td>
      <td className={tdCls}>{fmtDate(loan.dueDate)}</td>
      <td className={`${tdCls} font-semibold text-red-600 dark:text-red-400`}>{days}</td>
      <td className={tdCls}>{money(fine.amount)}</td>
    </tr>
  );
}
