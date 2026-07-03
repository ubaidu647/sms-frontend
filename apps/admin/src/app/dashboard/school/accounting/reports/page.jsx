'use client';
import React, { useMemo, useState } from 'react';
import { Search, Printer, Scale, TrendingUp, Landmark, Users } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { formatMoney, formatLedgerAmount, todayYMD } from '@/constants/accounting';

const REPORT_TABS = [
  { key: 'trial-balance', label: 'Trial Balance', icon: Scale },
  { key: 'income-statement', label: 'Income Statement', icon: TrendingUp },
  { key: 'balance-sheet', label: 'Balance Sheet', icon: Landmark },
  { key: 'party', label: 'Party Ledger', icon: Users },
];

const inputWrap =
  'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none';

export default function ReportsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-financial-report');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [reportType, setReportType] = useState('trial-balance');

  // Draft/applied filters — no auto date defaults so newly posted entries aren't
  // silently excluded; the user picks a range and hits Run.
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [draftAsOf, setDraftAsOf] = useState(todayYMD());
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftPartyAccount, setDraftPartyAccount] = useState('');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [asOf, setAsOf] = useState(todayYMD());
  const [branchId, setBranchId] = useState('');
  const [partyAccount, setPartyAccount] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const applyFilters = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setAsOf(draftAsOf);
    setBranchId(draftBranchId);
    setPartyAccount(draftPartyAccount);
  };

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  // Control-account options for the party ledger picker.
  const { data: accountData } = useQuery({
    queryKey: ['control-accounts', effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/account/list',
        page: 1,
        limit: 1000,
        token,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && reportType === 'party',
    staleTime: 30000,
  });
  const controlAccounts = useMemo(
    () => (accountData?.data || []).filter((a) => a.isControlAccount),
    [accountData],
  );

  const reportUrl = () => {
    if (reportType === 'balance-sheet') return '/ledger/report/balance-sheet';
    if (reportType === 'party') return partyAccount ? `/ledger/report/party/${partyAccount}` : null;
    return `/ledger/report/${reportType}`;
  };

  const { data, isFetching } = useQuery({
    queryKey: ['financial-report', reportType, from, to, asOf, effectiveBranchId, partyAccount],
    queryFn: () => {
      const params = {};
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      if (reportType === 'balance-sheet') {
        if (asOf) params.asOf = asOf;
      } else {
        if (from) params.from = from;
        if (to) params.to = to;
      }
      return fetchData({ url: reportUrl(), page: 1, limit: 1000, token, ...params });
    },
    enabled: !!token && !!user && !!reportUrl(),
    placeholderData: keepPreviousData,
  });
  const report = data?.data;

  return (
    <div className="p-3 sm:p-6 print:p-0">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 print:hidden">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Financial Reports
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Trial balance, profit &amp; loss, balance sheet and party sub-ledgers.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 self-start"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Report type selector */}
        <div className="flex flex-wrap gap-2 mb-4 print:hidden">
          {REPORT_TABS.map((t) => {
            const Icon = t.icon;
            const active = reportType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setReportType(t.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                  active
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-teal-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 print:hidden">
          {reportType === 'party' && (
            <select
              value={draftPartyAccount}
              onChange={(e) => setDraftPartyAccount(e.target.value)}
              className={inputWrap}
            >
              <option value="">Select control account…</option>
              {controlAccounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code} · {a.name}
                  {a.subLedgerType ? ` (${a.subLedgerType})` : ''}
                </option>
              ))}
            </select>
          )}

          {reportType === 'balance-sheet' ? (
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              As of
              <input
                type="date"
                value={draftAsOf}
                onChange={(e) => setDraftAsOf(e.target.value)}
                className={inputWrap}
              />
            </label>
          ) : (
            <>
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
            </>
          )}

          {isOrgLevel && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setDraftBranchId(e.target.value)}
              className={inputWrap}
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
            Run
          </button>
        </div>

        {/* Report body */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 print:border-0 print:shadow-none">
          {reportType === 'party' && !partyAccount ? (
            <Empty>Select a control account and press Run to view its party sub-ledger.</Empty>
          ) : isFetching && !report ? (
            <Empty>Loading report…</Empty>
          ) : !report ? (
            <Empty>No data for the selected filters.</Empty>
          ) : reportType === 'trial-balance' ? (
            <TrialBalance report={report} />
          ) : reportType === 'income-statement' ? (
            <IncomeStatement report={report} />
          ) : reportType === 'balance-sheet' ? (
            <BalanceSheet report={report} />
          ) : (
            <PartyLedger report={report} />
          )}
        </div>
      </div>
    </div>
  );
}

const Empty = ({ children }) => (
  <div className="py-16 text-center text-gray-400 text-sm">{children}</div>
);

const BalancedBadge = ({ balanced }) => (
  <span
    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
      balanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}
  >
    {balanced ? 'Balanced' : 'Out of balance'}
  </span>
);

function TrialBalance({ report }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Trial Balance</h2>
        <BalancedBadge balanced={report.balanced} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-left font-semibold">Account</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-3 py-2 text-right font-semibold">Credit</th>
            </tr>
          </thead>
          <tbody>
            {(report.rows || []).map((r) => (
              <tr
                key={r.accountId}
                className="border-t border-gray-100 dark:border-gray-800"
                style={{ paddingLeft: `${(r.level || 1) * 8}px` }}
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-500">{r.code}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{r.name}</td>
                <td className="px-3 py-2 text-gray-500 capitalize">{r.type}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatLedgerAmount(r.debit ?? r.totalDebit)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatLedgerAmount(r.credit ?? r.totalCredit)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold">
            <tr>
              <td className="px-3 py-2" colSpan={3}>
                Total
              </td>
              <td className="px-3 py-2 text-right font-mono">{formatMoney(report.totalDebit)}</td>
              <td className="px-3 py-2 text-right font-mono">{formatMoney(report.totalCredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function AccountLines({ rows }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {(rows || []).map((r) => (
        <div key={r.accountId} className="flex justify-between py-1.5 text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            <span className="font-mono text-xs text-gray-400 mr-2">{r.code}</span>
            {r.name}
          </span>
          <span className="font-mono text-gray-900 dark:text-gray-100">
            {formatMoney(r.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

function IncomeStatement({ report }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Income Statement</h2>
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Income</h3>
        <AccountLines rows={report.income} />
        <div className="flex justify-between py-2 mt-1 border-t border-gray-200 dark:border-gray-700 font-semibold text-sm">
          <span>Total Income</span>
          <span className="font-mono text-green-700 dark:text-green-400">
            {formatMoney(report.totalIncome)}
          </span>
        </div>
      </section>
      <section>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Expenses</h3>
        <AccountLines rows={report.expense} />
        <div className="flex justify-between py-2 mt-1 border-t border-gray-200 dark:border-gray-700 font-semibold text-sm">
          <span>Total Expenses</span>
          <span className="font-mono text-red-700 dark:text-red-400">
            {formatMoney(report.totalExpense)}
          </span>
        </div>
      </section>
      <div className="flex justify-between py-3 border-t-2 border-gray-300 dark:border-gray-600 text-base font-bold">
        <span>Net {report.netProfit >= 0 ? 'Profit' : 'Loss'}</span>
        <span className={report.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}>
          {formatMoney(report.netProfit)}
        </span>
      </div>
    </div>
  );
}

function BalanceSheet({ report }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Balance Sheet</h2>
        <BalancedBadge balanced={report.balanced} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Assets</h3>
          <AccountLines rows={report.assets} />
          <div className="flex justify-between py-2 mt-1 border-t border-gray-200 dark:border-gray-700 font-semibold text-sm">
            <span>Total Assets</span>
            <span className="font-mono">{formatMoney(report.totalAssets)}</span>
          </div>
        </section>
        <section className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Liabilities
            </h3>
            <AccountLines rows={report.liabilities} />
            <div className="flex justify-between py-2 mt-1 border-t border-gray-200 dark:border-gray-700 font-semibold text-sm">
              <span>Total Liabilities</span>
              <span className="font-mono">{formatMoney(report.totalLiabilities)}</span>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Equity
            </h3>
            <AccountLines rows={report.equity} />
            <div className="flex justify-between py-1.5 text-sm text-gray-700 dark:text-gray-300">
              <span>Retained Earnings</span>
              <span className="font-mono">{formatMoney(report.retainedEarnings)}</span>
            </div>
            <div className="flex justify-between py-2 mt-1 border-t border-gray-200 dark:border-gray-700 font-semibold text-sm">
              <span>Total Equity</span>
              <span className="font-mono">{formatMoney(report.totalEquity)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PartyLedger({ report }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {report.account?.code} · {report.account?.name}
          </h2>
          <p className="text-xs text-gray-500 capitalize">
            {report.account?.subLedgerType} sub-ledger
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Control balance</div>
          <div className="font-mono font-bold text-teal-700 dark:text-teal-400">
            {formatMoney(report.controlBalance)}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Party</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-3 py-2 text-right font-semibold">Credit</th>
              <th className="px-3 py-2 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {(report.parties || []).map((p) => (
              <tr key={p.partyId} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.partyLabel}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatLedgerAmount(p.totalDebit)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatLedgerAmount(p.totalCredit)}
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {formatMoney(p.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
