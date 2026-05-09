'use client';
import React, { useEffect, useState } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { Clock, MapPin } from 'lucide-react';
import { DAY_LABELS } from '@/constants/timetable';

export default function NowPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-timetable');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [branchId, setBranchId] = useState('');
  const [tick, setTick] = useState(0);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: nowRes, isFetching } = useQuery({
    queryKey: ['timetable-now', isOrgLevel ? branchId : userBranchId, tick],
    queryFn: () =>
      fetchData({
        url: '/timetable/now',
        token,
        branchId: (isOrgLevel ? branchId : undefined) || undefined,
      }),
    enabled: !!token,
    staleTime: 0,
  });
  const data = nowRes?.data;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <Clock className="w-6 h-6 text-teal-700 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              Now
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {data?.now ?? '—'} · {data?.day ? DAY_LABELS[data.day] : '—'}
            </p>
            {data?.period ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {data.period.name} ({data.period.startTime} – {data.period.endTime})
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No active period</p>
            )}
          </div>
        </div>
        {isOrgLevel && (
          <select
            value={branchId}
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
        )}
      </div>

      {isFetching && !data && (
        <div className="text-xs text-gray-500 dark:text-gray-400">Loading…</div>
      )}

      {data?.slots?.length ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {data.slots.length} class{data.slots.length === 1 ? '' : 'es'} in session
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Auto-refreshes every minute</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.slots.map((s) => (
              <div
                key={s._id}
                className="px-4 py-3 flex items-center justify-between flex-wrap gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {s.subject?.name || s.customLabel || '—'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {s.class?.name}
                    {s.section?.name ? ` - ${s.section.name}` : ''} ·{' '}
                    {s.staff?.user?.name || '—'}
                  </div>
                </div>
                {s.room && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-3 h-3" /> {s.room}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        !isFetching && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            {data?.period
              ? 'No classes scheduled for this period.'
              : 'School is not in session right now.'}
          </div>
        )
      )}
    </div>
  );
}
