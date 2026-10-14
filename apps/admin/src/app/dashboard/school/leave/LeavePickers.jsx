'use client';
// Pickers used across the Leave screens — built on the existing staff/student/
// class list endpoints.
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import { currentAcademicYear } from '@/utils/academicYear';
import { inputCls } from './leaveShared';

export const staffLabel = (s) => {
  const name = s?.user?.name || s?.userId?.name || s?.name || 'Staff';
  const ref = s?.serialNumber || s?.user?.serialNumber;
  return ref ? `${name} (${ref})` : name;
};

/** Branch dropdown (org-tier). `allLabel` adds an empty "all/default" option. */
export function BranchSelect({ value, onChange, allLabel, disabled }) {
  const { accessToken: token } = useTokenStore();
  const { data } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token,
    staleTime: Infinity,
  });
  const branches = data?.data || [];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={inputCls}
    >
      {allLabel !== undefined && <option value="">{allLabel}</option>}
      {branches.map((b) => (
        <option key={b._id} value={b._id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}

/** Active staff dropdown, optionally limited to a branch. Reports the full row. */
export function StaffSelect({ value, onChange, branchId, placeholder = 'Select staff...' }) {
  const { accessToken: token } = useTokenStore();
  const { data, isLoading } = useQuery({
    queryKey: ['leave-staff-options', branchId || ''],
    queryFn: () =>
      fetchData({
        url: '/staff/list',
        page: 1,
        limit: 1000,
        token,
        ...(branchId ? { branchId } : {}),
      }),
    enabled: !!token,
    staleTime: 60000,
  });
  const staff = useMemo(() => data?.data || [], [data]);
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(
          e.target.value,
          staff.find((s) => s._id === e.target.value),
        )
      }
      className={inputCls}
    >
      <option value="">{isLoading ? 'Loading…' : placeholder}</option>
      {staff.map((s) => (
        <option key={s._id} value={s._id}>
          {staffLabel(s)}
          {s.staffType ? ` · ${s.staffType}` : ''}
        </option>
      ))}
    </select>
  );
}

/** Search-as-you-type active student picker. */
export function StudentPicker({ value, label, onSelect, onClear }) {
  const { accessToken: token } = useTokenStore();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['leave-student-search', search],
    queryFn: () =>
      fetchData({ url: '/student/list', page: 1, limit: 10, token, search, isActive: true }),
    enabled: !!token && search.trim().length >= 2,
    staleTime: 10000,
  });
  const students = data?.data || [];

  if (value) {
    return (
      <div className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
        <span className="text-sm text-gray-900 dark:text-gray-100">{label}</span>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setOpen(false);
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
          setOpen(true);
        }}
        placeholder="Type name or admission #..."
        className={inputCls}
      />
      {open && search.trim().length >= 2 && students.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {students.map((s) => {
            const name = s.user?.name || s.name || 'Student';
            const cls = [s.class?.name, s.section?.name].filter(Boolean).join(' - ');
            return (
              <li
                key={s._id}
                className="px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer text-sm"
                onClick={() => {
                  setOpen(false);
                  onSelect?.({
                    studentId: s._id,
                    label: `${name}${s.admissionNumber ? ` — ${s.admissionNumber}` : ''}${
                      cls ? ` (${cls})` : ''
                    }`,
                  });
                }}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {s.admissionNumber || '—'}
                  {cls ? ` · ${cls}` : ''}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {open && search.trim().length >= 2 && data && students.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No students found.</p>
      )}
    </div>
  );
}

/** Class + section cascade for the current academic year of a branch. */
export function ClassSectionSelect({ branchId, classId, sectionId, onChange }) {
  const { accessToken: token } = useTokenStore();
  const academicYear = currentAcademicYear();

  const { data: classData } = useQuery({
    queryKey: ['classes-dropdown', branchId, academicYear],
    queryFn: () =>
      fetchData({ url: '/class/list', page: 1, limit: 200, token, branchId, academicYear }),
    enabled: !!token && !!branchId,
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

  // A branch change invalidates the picked class.
  useEffect(() => {
    if (classId && classes.length && !classes.some((c) => c._id === classId)) {
      onChange({ classId: '', sectionId: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  return (
    <>
      <select
        value={classId}
        onChange={(e) => onChange({ classId: e.target.value, sectionId: '' })}
        disabled={!branchId}
        className={inputCls}
      >
        <option value="">{branchId ? 'All classes' : 'Select branch first'}</option>
        {classes.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        value={sectionId}
        onChange={(e) => onChange({ classId, sectionId: e.target.value })}
        disabled={!classId}
        className={inputCls}
      >
        <option value="">All sections</option>
        {sections.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name}
          </option>
        ))}
      </select>
    </>
  );
}
