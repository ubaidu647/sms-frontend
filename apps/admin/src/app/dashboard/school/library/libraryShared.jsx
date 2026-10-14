'use client';
// Shared bits for the Library screens (styles, badges, queries, invalidation).
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { formatAmount } from '@/utils/money';
import {
  COPY_STATUS_COLORS,
  FINE_STATUS_COLORS,
  LIBRARY_DEFAULT_SETTINGS,
  LOAN_STATUS_COLORS,
  loanDisplayStatus,
  ymdOf,
} from '@/utils/library';

export const inputCls =
  'w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:opacity-60';

export const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const dangerBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const cardCls =
  'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4';

export const thCls =
  'text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide';
export const tdCls = 'px-3 py-2 text-sm text-gray-700 dark:text-gray-300';

export const errorCls = 'text-xs text-red-600 dark:text-red-400 mt-1';

export const Spinner = () => (
  <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
);

function Badge({ cls, children }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${cls}`}
    >
      {children}
    </span>
  );
}

export function LoanStatusBadge({ loan }) {
  const s = loanDisplayStatus(loan);
  return <Badge cls={LOAN_STATUS_COLORS[s] || LOAN_STATUS_COLORS.returned}>{s}</Badge>;
}

export function CopyStatusBadge({ status }) {
  return (
    <Badge cls={COPY_STATUS_COLORS[status] || COPY_STATUS_COLORS.withdrawn}>{status || '—'}</Badge>
  );
}

/** Fine amount + status badge ("Rs 40 · pending"); "—" when there is none. */
export function FineCell({ fine }) {
  const status = fine?.status || 'none';
  const amount = Number(fine?.amount) || 0;
  if (status === 'none' && !amount) return <span className="text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Rs {formatAmount(amount)}
      </span>
      <Badge cls={FINE_STATUS_COLORS[status] || FINE_STATUS_COLORS.none}>{status}</Badge>
    </span>
  );
}

/** Stored date-only value → 'YYYY-MM-DD' (keeps UTC formatting), '—' when empty. */
export const fmtDate = (v) => ymdOf(v) || '—';

export const money = (n) => `Rs ${formatAmount(n)}`;

/**
 * Effective library settings for a branch (empty = the caller's own branch /
 * school default). Falls back to the built-in defaults while loading.
 */
export function useLibrarySettings(branchId, { enabled = true } = {}) {
  const { accessToken: token } = useTokenStore();
  const query = useQuery({
    queryKey: ['library-settings', branchId || ''],
    queryFn: () =>
      fetchData({ url: '/library/settings', token, ...(branchId ? { branchId } : {}) }),
    enabled: !!token && enabled,
    retry: retryUnless4xx,
    staleTime: 60000,
  });
  const payload = query.data?.data;
  return {
    ...query,
    settings: payload?.settings || LIBRARY_DEFAULT_SETTINGS,
    source: payload?.source || 'default',
  };
}

/** After any circulation / fine mutation. */
export function invalidateLibraryCirculation(queryClient) {
  [
    ['library-summary'],
    ['library-loans'],
    ['library-borrower'],
    ['library-lookup'],
    ['library-books'],
    ['library-book'],
  ].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

/** After a catalogue (book / copy) mutation. */
export function invalidateLibraryCatalogue(queryClient) {
  [['library-books'], ['library-book'], ['library-summary'], ['library-lookup']].forEach(
    (queryKey) => queryClient.invalidateQueries({ queryKey }),
  );
}
