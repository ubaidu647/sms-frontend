'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { formatMoney, PAYMENT_METHOD_COLORS, todayYMD } from '@/constants/fee';
import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CollectionReportPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const t = useTranslations('collectionReport');

  const [from, setFrom] = useState(todayYMD());
  const [to, setTo] = useState(todayYMD());
  const [branchId, setBranchId] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-payment');

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data, isFetching } = useQuery({
    queryKey: ['report-collection', from, to, branchId],
    queryFn: () =>
      fetchData({
        url: '/fee/report/collection',
        token,
        from,
        to,
        branchId: branchId || undefined,
      }),
    enabled: !!token && !!from && !!to,
  });

  const report = data?.data;

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-teal-600" /> {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none"
            />
          </div>
          {isOrgLevel && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Branch
              </label>
              <select
                value={branchId}
                onFocus={() => setBranchDropdownTouched(true)}
                onChange={(e) => setBranchId(e.target.value)}
                className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isFetching && !report ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : !report ? null : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl p-6 shadow-sm">
                <div className="text-sm opacity-90 uppercase tracking-widest">Total Collected</div>
                <div className="text-4xl font-bold mt-2">{formatMoney(report.grandTotal)}</div>
                <div className="text-sm opacity-90 mt-1">
                  {report.from} → {report.to}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Payments
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                  {report.totalCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {report.byMethod?.length || 0} method(s)
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Breakdown by Method
                </h2>
              </div>
              {!report.byMethod || report.byMethod.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No payments in range.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3 text-left">Method</th>
                      <th className="px-6 py-3 text-right">Count</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byMethod.map((m) => {
                      const share = report.grandTotal
                        ? Math.round((m.total / report.grandTotal) * 100)
                        : 0;
                      return (
                        <tr key={m._id} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                PAYMENT_METHOD_COLORS[m._id] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {m._id}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">
                            {m.count}
                          </td>
                          <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                            {formatMoney(m.total)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-teal-500"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400 w-10 text-right">
                                {share}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
