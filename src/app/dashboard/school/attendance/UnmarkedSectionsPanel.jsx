'use client';
import React, { useState } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export default function UnmarkedSectionsPanel() {
  const { accessToken: token } = useTokenStore();
  const [date, setDate] = useState(todayISO());
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const { data, isFetching } = useQuery({
    queryKey: ['attendance-unmarked', date, academicYear],
    queryFn: () =>
      fetchData({
        url: '/attendance/unmarked-sections',
        token,
        date,
        academicYear: academicYear || undefined,
      }),
    enabled: !!token && !!date,
    staleTime: 30000,
  });

  const sections = data?.data?.sections || [];
  const count = data?.data?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Academic Year (optional)</label>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {isFetching && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isFetching && count === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-green-200 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
          <p className="text-green-700 dark:text-green-400 font-medium mt-3">All sections have marked attendance for {date}.</p>
        </div>
      )}

      {!isFetching && count > 0 && (
        <>
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">{count}</span>
            <span>section{count > 1 ? 's' : ''} have not marked attendance on {date}.</span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Class</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Section</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Academic Year</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Strength</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.sectionId} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.class?.name || '—'}</div>
                      {s.class?.grade && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">Grade {s.class.grade}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{s.sectionName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{s.academicYear || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                      {s.currentStrength}/{s.capacity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
