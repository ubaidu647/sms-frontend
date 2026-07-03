'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Printer } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import {
  JOURNAL_SOURCE_COLORS,
  formatDate,
  formatLedgerAmount,
  formatMoney,
} from '@/constants/accounting';

const inputWrap =
  'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none';

export default function AccountLedgerPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const searchParams = useSearchParams();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-journal');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [accountId, setAccountId] = useState(searchParams.get('accountId') || '');
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // Deep-link: when navigated from the Chart of Accounts row action, preselect.
  useEffect(() => {
    const q = searchParams.get('accountId');
    if (q) setAccountId(q);
  }, [searchParams]);

  const effectiveBranchId = isOrgLevel ? '' : userBranchId;

  const { data: accountData } = useQuery({
    queryKey: ['ledger-account-picker', effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/account/list',
        page: 1,
        limit: 1000,
        token,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token,
    staleTime: 30000,
  });
  const accounts = useMemo(
    () => (accountData?.data || []).filter((a) => !a.isGroup),
    [accountData],
  );

  const applyFilters = () => {
    setFrom(draftFrom);
    setTo(draftTo);
  };

  const { data, isFetching } = useQuery({
    queryKey: ['account-ledger', accountId, from, to],
    queryFn: () => {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      return fetchData({
        url: `/ledger/account/${accountId}`,
        page: 1,
        limit: 1000,
        token,
        ...params,
      });
    },
    enabled: !!token && !!user && !!accountId,
    placeholderData: keepPreviousData,
  });
  const ledger = data?.data;

  return (
    <div className="p-3 sm:p-6 print:p-0">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Account Ledger
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Running statement of every posting against a single ledger account.
            </p>
          </div>
          {ledger && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 self-start"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 print:hidden">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={`${inputWrap} min-w-[220px]`}
          >
            <option value="">Select account…</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
            className={inputWrap}
            title="From date"
          />
          <input
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
            className={inputWrap}
            title="To date"
          />
          <button
            type="button"
            onClick={applyFilters}
            className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Search className="w-4 h-4" />
            Run
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 print:border-0">
          {!accountId ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              Select an account to view its ledger.
            </div>
          ) : isFetching && !ledger ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading ledger…</div>
          ) : !ledger ? (
            <div className="py-16 text-center text-gray-400 text-sm">No entries in this range.</div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                {ledger.account?.code} · {ledger.account?.name}
                <span className="ml-2 text-xs font-normal text-gray-500 capitalize">
                  {ledger.account?.type}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Date</th>
                      <th className="px-3 py-2 text-left font-semibold">Entry</th>
                      <th className="px-3 py-2 text-left font-semibold">Narration</th>
                      <th className="px-3 py-2 text-right font-semibold">Debit</th>
                      <th className="px-3 py-2 text-right font-semibold">Credit</th>
                      <th className="px-3 py-2 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ledger.rows || []).map((r) => (
                      <tr key={r._id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {formatDate(r.date)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs text-gray-500">{r.serialNumber}</div>
                          {r.source && (
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                JOURNAL_SOURCE_COLORS[r.source] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {r.source}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[240px] truncate">
                          {r.narration}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatLedgerAmount(r.debit)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatLedgerAmount(r.credit)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          {formatMoney(r.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
