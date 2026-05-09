'use client';
import React, { useState, useEffect } from 'react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

function pctColor(pct) {
  if (pct == null) return 'bg-gray-100 text-gray-600';
  if (pct >= 90) return 'bg-green-100 text-green-800';
  if (pct >= 75) return 'bg-teal-100 text-teal-800';
  if (pct >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export default function MonthlySummaryPanel() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-attendance');
  const userBranchId = user?.branchId || user?.branch?._id || '';

  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchId, setBranchId] = useState(isOrgLevel ? '' : userBranchId);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState(currentMonth());

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', effectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        branchId: effectiveBranchId,
        academicYear,
      }),
    enabled: !!token && !!effectiveBranchId && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-dropdown', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  useEffect(() => { setClassId(''); setSectionId(''); }, [effectiveBranchId, academicYear]);
  useEffect(() => { setSectionId(''); }, [classId]);

  const { data, isFetching } = useQuery({
    queryKey: ['attendance-summary', classId, sectionId, month],
    queryFn: () =>
      fetchData({
        url: '/attendance/section/summary',
        token,
        classId,
        sectionId,
        month,
      }),
    enabled: !!token && !!classId && !!sectionId && !!month,
    staleTime: 30000,
  });

  const students = data?.data?.students || [];

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {isOrgLevel && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
              >
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Academic Year</label>
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2025-2026"
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={!effectiveBranchId}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
            >
              <option value="">{effectiveBranchId ? 'Select class...' : 'Select branch first'}</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.grade ? `(Grade ${c.grade})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!classId}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:bg-gray-50"
            >
              <option value="">{classId ? 'Select section...' : 'Select class first'}</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {(!classId || !sectionId) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Pick a class, section and month to load the summary.</p>
        </div>
      )}

      {classId && sectionId && isFetching && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {classId && sectionId && !isFetching && students.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide w-16">Roll</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Student</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Present</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">Late</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wide">Half</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">Absent</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Leave</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Holiday</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.studentId} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">{s.rollNumber}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{s.admissionNumber}</div>
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{s.present}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{s.late}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{s.halfDay}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{s.absent}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{s.leave}</td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700 dark:text-gray-300">{s.holiday}</td>
                  <td className="px-3 py-3 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{s.total}</td>
                  <td className="px-3 py-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${pctColor(s.percentage)}`}>
                      {s.percentage != null ? `${s.percentage.toFixed(1)}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {classId && sectionId && !isFetching && students.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No data for this month.</p>
        </div>
      )}
    </div>
  );
}
