'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import {
  currentAcademicYear,
  formatDate,
  formatMoney,
} from '@/constants/fee';
import { TrendingDown } from 'lucide-react';

export default function OutstandingReportPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-fee');
  const userBranchId = user?.branchId || user?.branch?._id || '';
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data: classData } = useQuery({
    queryKey: ['classes-outstanding', effectiveBranchId, academicYear],
    queryFn: () =>
      fetchData({
        url: '/class/list',
        page: 1,
        limit: 200,
        token,
        academicYear,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && !!academicYear,
    staleTime: 60000,
  });
  const classes = classData?.data || [];

  const { data: sectionData } = useQuery({
    queryKey: ['sections-outstanding', classId],
    queryFn: () => fetchData({ url: `/class/${classId}/sections`, token }),
    enabled: !!token && !!classId,
    staleTime: 60000,
  });
  const sections = sectionData?.data || [];

  const { data, isFetching } = useQuery({
    queryKey: [
      'report-outstanding',
      academicYear,
      classId,
      sectionId,
      branchId,
      isOrgLevel,
      userBranchId,
    ],
    queryFn: () => {
      const params = {};
      if (!isOrgLevel) params.branchId = userBranchId;
      else if (branchId) params.branchId = branchId;
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;
      if (academicYear) params.academicYear = academicYear;
      return fetchData({ url: '/fee/report/outstanding', token, ...params });
    },
    enabled: !!token,
  });

  const report = data?.data;
  const students = report?.students || [];

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingDown className="w-7 h-7 text-red-500" /> Outstanding Fees
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Defaulters ranked by outstanding amount.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-6">
          <input
            type="text"
            placeholder="2025-2026"
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              setClassId('');
              setSectionId('');
            }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 w-32 outline-none"
          />
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId('');
            }}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} {c.grade ? `(Gr ${c.grade})` : ''}
              </option>
            ))}
          </select>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={!classId}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">{classId ? 'All Sections' : 'Pick class'}</option>
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          {isOrgLevel && (
            <select
              value={branchId}
              onFocus={() => setBranchDropdownTouched(true)}
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

        {isFetching && !report ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        ) : !report ? null : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-sm">
                <div className="text-sm opacity-90 uppercase tracking-widest">Total Outstanding</div>
                <div className="text-4xl font-bold mt-2">{formatMoney(report.grandTotal)}</div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  Students With Dues
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">{report.studentCount}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Defaulter List</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">{students.length} student(s)</span>
              </div>
              {students.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">No outstanding fees.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3 text-left">Student</th>
                      <th className="px-6 py-3 text-left">Roll</th>
                      <th className="px-6 py-3 text-right">Vouchers</th>
                      <th className="px-6 py-3 text-left">Oldest Due</th>
                      <th className="px-6 py-3 text-right">Outstanding</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.studentId} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {s.photo ? (
                              <img
                                src={s.photo}
                                alt={s.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                                {s.name?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{s.admissionNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{s.rollNumber}</td>
                        <td className="px-6 py-3 text-right text-gray-700 dark:text-gray-300">{s.voucherCount}</td>
                        <td className="px-6 py-3 text-gray-700 dark:text-gray-300">{formatDate(s.oldestDueDate)}</td>
                        <td className="px-6 py-3 text-right font-medium text-red-700 dark:text-red-400">
                          {formatMoney(s.outstandingTotal)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Link
                            href={{
                              pathname: '/dashboard/school/fees/vouchers',
                              query: {
                                studentId: s.studentId,
                                academicYear: academicYear || '',
                                ...(classId ? { classId } : {}),
                                ...(sectionId ? { sectionId } : {}),
                                ...(branchId ? { branchId } : {}),
                              },
                            }}
                            className="text-xs text-teal-600 hover:underline"
                          >
                            View vouchers →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
