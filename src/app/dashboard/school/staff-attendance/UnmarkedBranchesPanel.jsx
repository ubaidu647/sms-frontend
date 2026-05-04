'use client';
import React, { useState } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function UnmarkedBranchesPanel() {
  const { accessToken: token } = useTokenStore();
  const [date, setDate] = useState(todayISO());

  const { data, isFetching } = useQuery({
    queryKey: ['staff-attendance-unmarked-branches', date],
    queryFn: () =>
      fetchData({
        url: '/staff-attendance/unmarked-branches',
        token,
        date,
      }),
    enabled: !!token && !!date,
    staleTime: 30000,
  });

  const branches = data?.data?.branches || [];
  const count = data?.data?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {isFetching && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isFetching && count === 0 && (
        <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
          <p className="text-green-700 font-medium mt-3">
            All branches have marked staff attendance for {date}.
          </p>
        </div>
      )}

      {!isFetching && count > 0 && (
        <>
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">{count}</span>
            <span>
              branch{count > 1 ? 'es' : ''} have not marked staff attendance on {date}.
            </span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Branch
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Code
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Active Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr
                    key={b.branchId}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {b.branchName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{b.branchCode || '—'}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                      {b.staffCount ?? 0}
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
