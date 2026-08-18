'use client';
import React, { useMemo, useState } from 'react';
import { Search, Printer } from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import AccountCombobox from '@/component/AccountCombobox';
import {
  formatMoney,
  formatLedgerAmount,
  formatDate,
  todayYMD,
  ACCOUNT_TYPES,
  VOUCHER_TYPE_LABELS,
} from '@/constants/accounting';

// Each financial report is its own sidebar entry / route; this component holds the
// shared filter bar + fetch and renders the body for whichever `type` it is given.
export const REPORT_META = {
  'trial-balance': {
    title: 'Trial Balance',
    subtitle: 'Debit and credit totals for every account over the selected range.',
  },
  'income-statement': {
    title: 'Income Statement',
    subtitle: 'Income, expenses and net profit or loss for the selected period.',
  },
  'balance-sheet': {
    title: 'Balance Sheet',
    subtitle: 'Assets, liabilities and equity as of a chosen date.',
  },
  party: {
    title: 'Party Ledger',
    subtitle:
      'Subsidiary ledger for any postable account — party-wise for control accounts, transaction detail for the rest.',
  },
};

const inputWrap =
  'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none';

export default function FinancialReport({ type }) {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-financial-report');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const meta = REPORT_META[type];

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

  // Subsidiary-ledger picker options: every postable (non-group) account.
  const { data: accountData } = useQuery({
    queryKey: ['subsidiary-accounts', effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/account/list',
        page: 1,
        limit: 1000,
        token,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && type === 'party',
    staleTime: 30000,
  });
  // Ordered by type then code so a long chart reads the way the chart does;
  // the picker groups on `type` and searches within it.
  const accountOptions = useMemo(() => {
    const postable = (accountData?.data || [])
      .filter((a) => !a.isGroup)
      .sort((a, b) => String(a.code).localeCompare(String(b.code)));
    return ACCOUNT_TYPES.flatMap((t) => postable.filter((a) => a.type === t));
  }, [accountData]);

  const reportUrl = () => {
    if (type === 'balance-sheet') return '/ledger/report/balance-sheet';
    if (type === 'party') return partyAccount ? `/ledger/report/party/${partyAccount}` : null;
    return `/ledger/report/${type}`;
  };

  const { data, isFetching } = useQuery({
    queryKey: ['financial-report', type, from, to, asOf, effectiveBranchId, partyAccount],
    queryFn: () => {
      const params = {};
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      if (type === 'balance-sheet') {
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
              {meta.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{meta.subtitle}</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 self-start"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 print:hidden">
          {type === 'party' && (
            <AccountCombobox
              accounts={accountOptions}
              value={draftPartyAccount}
              onChange={(id) => setDraftPartyAccount(id)}
              className="w-full sm:w-72"
              buttonClassName={inputWrap}
            />
          )}

          {type === 'balance-sheet' ? (
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
          {type === 'party' && !partyAccount ? (
            <Empty>Select an account and press Run to view its subsidiary ledger.</Empty>
          ) : isFetching && !report ? (
            <Empty>Loading report…</Empty>
          ) : !report ? (
            <Empty>No data for the selected filters.</Empty>
          ) : type === 'trial-balance' ? (
            <TrialBalance report={report} />
          ) : type === 'income-statement' ? (
            <IncomeStatement report={report} />
          ) : type === 'balance-sheet' ? (
            <BalanceSheet report={report} />
          ) : report.mode === 'detail' ? (
            <AccountLedger report={report} />
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
            {report.account?.subLedgerType} sub-ledger · {report.account?.type}
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

// Transaction detail for a postable account with no party sub-ledger.
function AccountLedger({ report }) {
  const entries = report.entries || [];
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {report.account?.code} · {report.account?.name}
          </h2>
          <p className="text-xs text-gray-500 capitalize">{report.account?.type} account</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Closing balance</div>
          <div className="font-mono font-bold text-teal-700 dark:text-teal-400">
            {formatMoney(report.closingBalance)}
          </div>
        </div>
      </div>

      {report.truncated && (
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
          Showing the first {report.maxRows} lines only — narrow the date range to see the rest.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">Entry</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Narration</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-3 py-2 text-right font-semibold">Credit</th>
              <th className="px-3 py-2 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100 dark:border-gray-800 text-gray-500">
              <td className="px-3 py-2" colSpan={4}>
                Opening balance
              </td>
              <td className="px-3 py-2 text-right font-mono">—</td>
              <td className="px-3 py-2 text-right font-mono">—</td>
              <td className="px-3 py-2 text-right font-mono font-semibold">
                {formatMoney(report.openingBalance)}
              </td>
            </tr>
            {entries.map((e, i) => (
              <tr
                key={`${e.entryId}-${i}`}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-400">
                  {formatDate(e.date)}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                  {e.serialNumber}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {VOUCHER_TYPE_LABELS[e.voucherType] || e.voucherType}
                </td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                  {e.description || e.narration}
                  {e.partyLabel && <span className="text-xs text-gray-500"> · {e.partyLabel}</span>}
                </td>
                <td className="px-3 py-2 text-right font-mono">{formatLedgerAmount(e.debit)}</td>
                <td className="px-3 py-2 text-right font-mono">{formatLedgerAmount(e.credit)}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">
                  {formatMoney(e.balance)}
                </td>
              </tr>
            ))}
            {!entries.length && (
              <tr className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-3 py-6 text-center text-gray-400" colSpan={7}>
                  No postings to this account for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100">
            <tr>
              <td className="px-3 py-2" colSpan={4}>
                Totals
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {formatLedgerAmount(report.totalDebit)}
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {formatLedgerAmount(report.totalCredit)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-teal-700 dark:text-teal-400">
                {formatMoney(report.closingBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
