'use client';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900';

// Inline student search/select. On pick it reports back the studentId, a human
// label, and the student's branchId (used to fetch the branch profile letterhead).
export default function StudentPickerInline({ value, label, onSelect, onClear, placeholder }) {
  const { accessToken: token } = useTokenStore();
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: studentData } = useQuery({
    queryKey: ['progress-student-search', search],
    queryFn: () =>
      fetchData({ url: '/student/list', page: 1, limit: 10, token, search, isActive: true }),
    enabled: !!token && search.length >= 2,
    staleTime: 10000,
  });
  const students = studentData?.data || [];

  if (value) {
    return (
      <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
        <span className="text-sm text-gray-900 dark:text-gray-100">{label}</span>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setShowResults(false);
            onClear?.();
          }}
          className="text-xs text-red-600 hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowResults(true);
        }}
        placeholder={placeholder || 'Type name or admission #...'}
        className={inputCls}
      />
      {showResults && search.length >= 2 && students.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {students.map((s) => {
            const name = s.user?.name || s.name || 'Student';
            // Student-list rows carry the branch as a populated `branch` object;
            // fall back to a raw/`branchId` shape just in case.
            const branchId =
              s.branch?._id ||
              (typeof s.branchId === 'object' ? s.branchId?._id : s.branchId) ||
              null;
            return (
              <li
                key={s._id}
                className="px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer text-sm"
                onClick={() => {
                  setShowResults(false);
                  onSelect?.({
                    studentId: s._id,
                    label: `${name}${s.admissionNumber ? ` — ${s.admissionNumber}` : ''}`,
                    branchId,
                  });
                }}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {s.admissionNumber || '—'}
                  {s.rollNumber ? ` · Roll ${s.rollNumber}` : ''}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
