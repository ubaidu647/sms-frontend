'use client';
import React, { useState } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DAY_LABELS, currentAcademicYear } from '@/constants/timetable';

export default function ConflictsPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-timetable');

  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState('');

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: conflictRes, isFetching } = useQuery({
    queryKey: ['timetable-conflicts', academicYear, branchId],
    queryFn: () =>
      fetchData({
        url: '/timetable/conflicts',
        token,
        academicYear,
        branchId: (isOrgLevel ? branchId : undefined) || undefined,
      }),
    enabled: !!token && !!academicYear,
    staleTime: 0,
  });
  const total = conflictRes?.data?.total || 0;
  const conflicts = conflictRes?.data?.conflicts || [];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Academic Year
            </label>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
            />
          </div>
          {isOrgLevel && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
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
      </div>

      {isFetching ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          Scanning…
        </div>
      ) : total === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">No conflicts</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            All teacher schedules are clean for {academicYear}.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-950/40 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {total} conflict{total === 1 ? '' : 's'} detected
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {conflicts.map((c, idx) => (
              <div key={idx} className="px-4 py-3">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {c.staff?.user?.name || c.staffId || 'Unknown teacher'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {DAY_LABELS[c.day] || c.day} · period {c.periodNumber}
                </div>
                <ul className="mt-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  {(c.slots || []).map((s) => (
                    <li key={s._id}>
                      {s.class?.name}
                      {s.section?.name ? ` - ${s.section.name}` : ''} ·{' '}
                      {s.subject?.name || s.customLabel}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
