'use client';
import React, { useState } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import {
  formatMonth,
  formatMoney,
  currentMonth,
  PAYSLIP_STATUS_COLORS,
} from '@/constants/staffSalary';
import {
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

export default function PayrollDashboardPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-payslip');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [month, setMonth] = useState(currentMonth());
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () =>
      fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data, isFetching } = useQuery({
    queryKey: ['payslip-summary', effectiveBranchId, month],
    queryFn: () =>
      fetchData({
        url: '/staff-salary/payslip/branch/summary',
        token,
        branchId: effectiveBranchId,
        month,
      }),
    enabled: !!token && !!effectiveBranchId && !!month,
    staleTime: 30000,
  });

  const summary = data?.data?.summary ?? data?.summary ?? null;
  const counts = {
    draft: summary?.draft || 0,
    finalized: summary?.finalized || 0,
    paid: summary?.paid || 0,
    cancelled: summary?.cancelled || 0,
  };
  const total =
    summary?.totalCount ??
    Object.values(counts).reduce((s, n) => s + (Number(n) || 0), 0);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Payroll Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Branch-level totals and payslip status for the selected month.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOrgLevel && (
              <select
                value={branchId}
                onFocus={() => setBranchDropdownTouched(true)}
                onChange={(e) => setBranchId(e.target.value)}
                className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>

        {!effectiveBranchId ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Pick a branch to load the dashboard.
          </div>
        ) : isFetching && !summary ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !summary ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No data for {formatMonth(month)}.
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                icon={Wallet}
                label="Gross"
                value={formatMoney(summary.totalGross || 0)}
                tone="teal"
              />
              <KpiCard
                icon={TrendingUp}
                label="Net (sum)"
                value={formatMoney(summary.totalNet || 0)}
                tone="blue"
              />
              <KpiCard
                icon={CheckCircle2}
                label="Total Paid"
                value={formatMoney(summary.totalPaid || 0)}
                tone="green"
              />
              <KpiCard
                icon={FileText}
                label="Payslips"
                value={total}
                tone="amber"
                subtitle={formatMonth(month)}
              />
            </div>

            {/* Status breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-4">
                Status Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatusTile
                  status="draft"
                  count={counts.draft || 0}
                  icon={Clock}
                />
                <StatusTile
                  status="finalized"
                  count={counts.finalized || 0}
                  icon={FileText}
                />
                <StatusTile
                  status="paid"
                  count={counts.paid || 0}
                  icon={CheckCircle2}
                />
                <StatusTile
                  status="cancelled"
                  count={counts.cancelled || 0}
                  icon={XCircle}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, subtitle, tone = 'teal' }) {
  const tones = {
    teal: 'from-teal-50 to-teal-100 text-teal-700 border-teal-200',
    blue: 'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
    green: 'from-green-50 to-green-100 text-green-700 border-green-200',
    amber: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
  };
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${tones[tone] || tones.teal} px-5 py-4`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest opacity-80">
            {label}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</div>
          {subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function StatusTile({ status, count, icon: Icon }) {
  const cls = PAYSLIP_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 capitalize">
          {status}
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</div>
      </div>
    </div>
  );
}
