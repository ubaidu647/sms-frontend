'use client';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatMoney, todayYMD } from '@/constants/accounting';
import { startOfMonthYMD, addMonthsYMD, addDaysYMD } from '@/utils/localDate';
import { filterCls, useBranches, useFinanceAccess } from '../_components/financeShared';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

/** Ready-made ranges a school owner actually asks about. */
function presetRange(preset) {
  const today = todayYMD();
  const thisMonth = startOfMonthYMD();
  switch (preset) {
    case 'this-month':
      return { from: thisMonth, to: today };
    case 'last-month': {
      const from = addMonthsYMD(thisMonth, -1);
      return { from, to: addDaysYMD(thisMonth, -1) };
    }
    case 'last-3-months':
      return { from: addMonthsYMD(thisMonth, -2), to: today };
    case 'this-year':
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    default:
      return null;
  }
}

function Card({ icon: Icon, label, amount, tone, valueTone }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tone}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
        <div className={`text-2xl font-bold ${valueTone || 'text-gray-900 dark:text-gray-100'}`}>
          {formatMoney(amount)}
        </div>
      </div>
    </div>
  );
}

function Breakdown({ title, rows, total, barTone, empty }) {
  return (
    <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {formatMoney(total)}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const share = total > 0 ? Math.max(0, (r.amount / total) * 100) : 0;
            return (
              <li key={r.accountId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{r.name}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatMoney(r.amount)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barTone}`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ProfitLossPage() {
  const { accessToken: token } = useTokenStore();
  const { user, isOrgLevel, userBranchId } = useFinanceAccess();

  const [preset, setPreset] = useState('this-month');
  const [custom, setCustom] = useState(presetRange('this-month'));
  const [branchId, setBranchId] = useState('');
  const [branchTouched, setBranchTouched] = useState(false);

  const range = preset === 'custom' ? custom : presetRange(preset);
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;
  const branches = useBranches(isOrgLevel && branchTouched);

  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-pnl', range?.from, range?.to, effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/finance/report/profit-loss',
        token,
        from: range?.from || undefined,
        to: range?.to || undefined,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && !!user,
  });
  const report = data?.data;
  const profit = report?.netProfit || 0;

  const maxMonth = useMemo(
    () => Math.max(1, ...(report?.months || []).map((m) => Math.max(m.income, m.expense))),
    [report],
  );

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Profit &amp; Loss
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kitna aaya, kitna gaya — fees, other income, salaries and expenses together.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={preset}
              onChange={(e) => {
                const next = e.target.value;
                if (next === 'custom') setCustom(range || presetRange('this-month'));
                setPreset(next);
              }}
              className={filterCls}
            >
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="last-3-months">Last 3 months</option>
              <option value="this-year">This year</option>
              <option value="custom">Custom dates</option>
            </select>
            {preset === 'custom' && (
              <>
                <input
                  type="date"
                  value={custom.from}
                  onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                  className={filterCls}
                />
                <input
                  type="date"
                  value={custom.to}
                  onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                  className={filterCls}
                />
              </>
            )}
            {isOrgLevel && (
              <select
                value={branchId}
                onFocus={() => setBranchTouched(true)}
                onChange={(e) => setBranchId(e.target.value)}
                className={filterCls}
              >
                <option value="">All branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error.message || 'Could not load the report'}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            icon={TrendingUp}
            label="Income"
            amount={report?.totalIncome || 0}
            tone="bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
          />
          <Card
            icon={TrendingDown}
            label="Expenses"
            amount={report?.totalExpense || 0}
            tone="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
          />
          <Card
            icon={Scale}
            label={profit < 0 ? 'Loss' : 'Profit'}
            amount={Math.abs(profit)}
            tone="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
            valueTone={profit < 0 ? 'text-red-600' : 'text-teal-700 dark:text-teal-300'}
          />
        </div>

        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

        {report && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Breakdown
                title="Income"
                rows={report.income}
                total={report.totalIncome}
                barTone="bg-green-500"
                empty="No income in this period."
              />
              <Breakdown
                title="Expenses"
                rows={report.expense}
                total={report.totalExpense}
                barTone="bg-red-500"
                empty="No expenses in this period."
              />
            </div>

            {report.months.length > 1 && (
              <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Month by month
                </h2>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400">
                      <th className="py-2 pr-4 font-medium">Month</th>
                      <th className="py-2 pr-4 font-medium text-right">Income</th>
                      <th className="py-2 pr-4 font-medium text-right">Expenses</th>
                      <th className="py-2 pr-4 font-medium text-right">Profit</th>
                      <th className="py-2 font-medium w-1/3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {report.months.map((m) => (
                      <tr key={m.month}>
                        <td className="py-2 pr-4 text-gray-800 dark:text-gray-200">
                          {monthLabel(m.month)}
                        </td>
                        <td className="py-2 pr-4 text-right text-green-700 dark:text-green-400">
                          {formatMoney(m.income)}
                        </td>
                        <td className="py-2 pr-4 text-right text-red-700 dark:text-red-400">
                          {formatMoney(m.expense)}
                        </td>
                        <td
                          className={`py-2 pr-4 text-right font-medium ${
                            m.profit < 0 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {formatMoney(m.profit)}
                        </td>
                        <td className="py-2">
                          <div className="space-y-1">
                            <div
                              className="h-1.5 rounded-full bg-green-500"
                              style={{ width: `${(m.income / maxMonth) * 100}%` }}
                            />
                            <div
                              className="h-1.5 rounded-full bg-red-500"
                              style={{ width: `${(m.expense / maxMonth) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
