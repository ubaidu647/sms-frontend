'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { fetchData } from '@/utils/api';
import { CalendarRange } from 'lucide-react';

const monthsAgoISO = (n) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
};
const todayISO = () => new Date().toISOString().slice(0, 10);

const STATUS_COLORS = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-amber-100 text-amber-800',
  leave: 'bg-blue-100 text-blue-700',
  excused: 'bg-purple-100 text-purple-700',
};

export default function OwnStudentAttendancePanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const [from, setFrom] = useState(monthsAgoISO(1));
  const [to, setTo] = useState(todayISO());

  const studentId = user?.studentId;

  const { data, isFetching, error } = useQuery({
    queryKey: ['own-student-attendance', studentId, from, to],
    queryFn: () =>
      fetchData({
        url: `/attendance/student/${studentId}/history`,
        token,
        from,
        to,
      }),
    enabled: !!token && !!studentId,
  });

  if (!studentId) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-sm text-gray-600 dark:text-gray-400">
        No student profile linked to this account.
      </div>
    );
  }

  const rows = data?.data || data || [];
  const errMsg = error?.response?.data?.message || error?.message;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <CalendarRange className="w-5 h-5 text-teal-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Attendance</h2>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none"
          />
          <label className="text-sm text-gray-500 dark:text-gray-400">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none"
          />
        </div>
      </div>

      {errMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
          {errMsg}
        </div>
      )}

      {isFetching ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No attendance records in this range.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-gray-900 dark:text-gray-100">
                    {r.date ? new Date(r.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {r.status || '—'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{r.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
