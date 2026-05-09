'use client';
import React, { useState } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { Search, UserCheck } from 'lucide-react';
import { DAYS, DAY_LABELS, currentAcademicYear } from '@/constants/timetable';

export default function FreeTeachersPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-timetable');

  const [day, setDay] = useState('mon');
  const [periodNumber, setPeriodNumber] = useState(1);
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState('');
  const [touched, setTouched] = useState(false);

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: freeRes, isFetching } = useQuery({
    queryKey: ['free-teachers', day, periodNumber, academicYear, branchId],
    queryFn: () =>
      fetchData({
        url: '/timetable/free-teachers',
        token,
        day,
        periodNumber,
        academicYear,
        branchId: (isOrgLevel ? branchId : undefined) || undefined,
      }),
    enabled: !!token && touched,
    staleTime: 0,
  });
  const teachers = freeRes?.data?.teachers || [];

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Day</label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Period Number
            </label>
            <input
              type="number"
              min="1"
              value={periodNumber}
              onChange={(e) => setPeriodNumber(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
            />
          </div>
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
          <div className="flex items-end">
            <button
              onClick={() => setTouched(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
            >
              <Search className="w-4 h-4" />
              Find
            </button>
          </div>
        </div>
      </div>

      {!touched ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          Pick a day and period, then hit <strong>Find</strong>.
        </div>
      ) : isFetching ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          Searching…
        </div>
      ) : !teachers.length ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          No teachers free at this time.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {teachers.length} free on {DAY_LABELS[day]}, period {periodNumber}
            </p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {teachers.map((t) => (
              <div key={t._id} className="px-4 py-3 flex items-center gap-3">
                {t.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.photo}
                    alt={t.user?.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 font-semibold">
                    {(t.user?.name || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{t.user?.name || '—'}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t.designation || '—'} · {t.serialNumber || ''}
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t.user?.email || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
