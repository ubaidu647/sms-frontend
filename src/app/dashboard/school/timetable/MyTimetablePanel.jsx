'use client';
import React, { useState, useMemo } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { MapPin } from 'lucide-react';
import {
  DAYS,
  DAY_LABELS,
  currentAcademicYear,
} from '@/constants/timetable';

export default function MyTimetablePanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-timetable');

  const ownStaffId =
    user?.staffId ||
    user?.staff?._id ||
    user?.staff_id ||
    (user?.staffType === 'teaching' ? user?._id : '');

  const [staffId, setStaffId] = useState(ownStaffId || '');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState('');

  const canPickOther = isAdmin || actions.includes('view-all-branch-timetable');

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && canPickOther,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: staffData } = useQuery({
    queryKey: ['teaching-staff-mytt', branchId],
    queryFn: () =>
      fetchData({
        url: '/staff/list',
        page: 1,
        limit: 500,
        token,
        staffType: 'teaching',
        branchId: branchId || undefined,
      }),
    enabled: !!token && canPickOther,
    staleTime: 60000,
  });
  const teachers = staffData?.data || [];

  const { data: ttRes, isFetching } = useQuery({
    queryKey: ['teacher-timetable', staffId, academicYear],
    queryFn: () =>
      fetchData({ url: `/timetable/teacher/${staffId}`, token, academicYear }),
    enabled: !!token && !!staffId,
    staleTime: 30000,
  });
  const grid = ttRes?.data?.grid || {};
  const slots = ttRes?.data?.slots || [];

  const periodNumbers = useMemo(() => {
    const set = new Set();
    DAYS.forEach((d) => {
      Object.keys(grid?.[d] || {}).forEach((n) => set.add(Number(n)));
    });
    if (set.size === 0) return [];
    const arr = Array.from(set);
    arr.sort((a, b) => a - b);
    return arr;
  }, [grid]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {canPickOther && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Branch</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Teacher</label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500"
                >
                  <option value="">Select teacher...</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.user?.name || t.designation}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Academic Year
            </label>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {!staffId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          {canPickOther
            ? 'Pick a teacher to view their schedule.'
            : 'No teaching staff record linked to your account.'}
        </div>
      ) : isFetching ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          Loading…
        </div>
      ) : !slots.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
          No classes assigned for {academicYear}.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs uppercase text-gray-500 font-semibold w-20">
                  Period
                </th>
                {DAYS.map((d) => (
                  <th
                    key={d}
                    className="px-3 py-3 text-left text-xs uppercase text-gray-500 font-semibold min-w-[160px]"
                  >
                    {DAY_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodNumbers.map((num) => (
                <tr key={num} className="border-t border-gray-100 align-top">
                  <td className="px-3 py-3 font-semibold text-gray-900 text-sm">
                    {num}
                  </td>
                  {DAYS.map((d) => {
                    const slot = grid?.[d]?.[num];
                    return (
                      <td key={d} className="px-3 py-3 border-l border-gray-100">
                        {slot ? (
                          <div>
                            <div className="font-semibold text-gray-900">
                              {slot.subject?.name || slot.customLabel || '—'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {slot.class?.name}
                              {slot.section?.name ? ` - ${slot.section.name}` : ''}
                            </div>
                            {slot.room && (
                              <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" /> {slot.room}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Free</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
