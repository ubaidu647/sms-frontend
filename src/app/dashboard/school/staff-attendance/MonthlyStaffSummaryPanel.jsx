'use client';
import React, { useState } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { STAFF_TYPES, formatWorkedMinutes } from '@/constants/staffAttendance';
import { formatMoney } from '@/constants/fee';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function pctColor(pct) {
  if (pct == null) return 'bg-gray-100 text-gray-600';
  if (pct >= 90) return 'bg-green-100 text-green-800';
  if (pct >= 75) return 'bg-teal-100 text-teal-800';
  if (pct >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export default function MonthlyStaffSummaryPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-staff-attendance');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [month, setMonth] = useState(currentMonth());
  const [staffType, setStaffType] = useState('');

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data, isFetching } = useQuery({
    queryKey: ['staff-attendance-summary', effectiveBranchId, month, staffType],
    queryFn: () =>
      fetchData({
        url: '/staff-attendance/branch/summary',
        token,
        branchId: effectiveBranchId,
        month,
        staffType: staffType || undefined,
      }),
    enabled: !!token && !!effectiveBranchId && !!month,
    staleTime: 30000,
  });

  const staff = data?.data?.staff || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {isOrgLevel && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500"
              >
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Type</label>
            <select
              value={staffType}
              onChange={(e) => setStaffType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500 capitalize"
            >
              <option value="">All</option>
              {STAFF_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!effectiveBranchId && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Pick a branch and month to load the summary.</p>
        </div>
      )}

      {effectiveBranchId && isFetching && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {effectiveBranchId && !isFetching && staff.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Staff
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Designation
                </th>
                <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Salary
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Present
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                  Late
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-orange-700 uppercase tracking-wide">
                  Half
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-red-700 uppercase tracking-wide">
                  Absent
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Leave
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Paid / Unpaid
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Holiday
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Worked
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr
                  key={s.staffId}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-400">
                      {s.serialNumber}
                      {s.staffType && (
                        <span className="ml-2 capitalize">· {s.staffType}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-700">{s.designation || '—'}</td>
                  <td className="px-3 py-3 text-right text-sm text-gray-700">
                    {s.salary != null ? formatMoney(s.salary) : '—'}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{s.present}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{s.late}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{s.halfDay}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{s.absent}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{s.leave}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">
                    <span className="text-green-700 font-medium">{s.paidLeave ?? 0}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-red-700 font-medium">{s.unpaidLeave ?? 0}</span>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">{s.holiday}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700">
                    {formatWorkedMinutes(s.totalWorkedMinutes)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${pctColor(s.percentage)}`}
                    >
                      {s.percentage != null ? `${Number(s.percentage).toFixed(1)}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {effectiveBranchId && !isFetching && staff.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No data for this month.</p>
        </div>
      )}
    </div>
  );
}
