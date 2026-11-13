'use client';
// Shared bits for the Certificates screens (styles, badges, pickers, cache).
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import PickerError from '@/component/PickerError';
import { retryUnless4xx } from '@/utils/queryError';
import { CERTIFICATE_STATUS_COLORS, certificateTypeLabel } from '@/utils/certificateText';

export const inputCls =
  'w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:opacity-60';

export const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const cardCls =
  'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4';

export const errorCls = 'text-xs text-red-600 dark:text-red-400 mt-1';

export const PRINT_PATH = (id) => `/dashboard/school/certificates/${id}/print`;

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
        CERTIFICATE_STATUS_COLORS[status] || CERTIFICATE_STATUS_COLORS.cancelled
      }`}
    >
      {status || '—'}
    </span>
  );
}

export const typeLabel = certificateTypeLabel;

/** After an issue / cancel: certificate views, eligibility and the students list. */
export function invalidateCertificateData(queryClient) {
  [['certificates'], ['certificate'], ['certificate-eligibility'], ['students']].forEach(
    (queryKey) => queryClient.invalidateQueries({ queryKey }),
  );
}

export function warningsOf(res) {
  const w = res?.warnings ?? res?.data?.warnings;
  return Array.isArray(w) ? w.filter(Boolean) : [];
}

/** Branch dropdown (org-tier). `allLabel` adds an empty "all" option. */
export function BranchSelect({ value, onChange, allLabel }) {
  const { accessToken: token } = useTokenStore();
  const { data } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token,
    staleTime: Infinity,
  });
  const branches = data?.data || [];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {allLabel !== undefined && <option value="">{allLabel}</option>}
      {branches.map((b) => (
        <option key={b._id} value={b._id}>
          {b.name}
        </option>
      ))}
    </select>
  );
}

/** One-line label for a /student/list row. */
export function studentOptionLabel(s) {
  const name = s?.user?.name || s?.name || 'Student';
  const cls = [s?.class?.name, s?.section?.name].filter(Boolean).join(' - ');
  return `${name}${s?.admissionNumber ? ` — ${s.admissionNumber}` : ''}${cls ? ` (${cls})` : ''}`;
}

/**
 * Search-as-you-type student picker over /student/list. `left` searches the
 * inactive (left) students instead — character certificates may be issued for
 * them.
 */
export function StudentSearch({ value, label, onSelect, onClear }) {
  const { accessToken: token } = useTokenStore();
  const [search, setSearch] = useState('');
  const [left, setLeft] = useState(false);
  const [open, setOpen] = useState(false);
  const term = search.trim();

  const { data, isFetching, error } = useQuery({
    queryKey: ['certificate-student-search', term, left],
    queryFn: () =>
      fetchData({ url: '/student/list', page: 1, limit: 10, token, search: term, isActive: !left }),
    enabled: !!token && term.length >= 2,
    staleTime: 10000,
    retry: retryUnless4xx,
  });
  const students = data?.data || [];

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-teal-50 dark:bg-teal-950/40">
        <span className="text-sm text-gray-900 dark:text-gray-100 min-w-0 break-words">
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            setSearch('');
            setOpen(false);
            onClear?.();
          }}
          className="text-xs text-red-600 hover:underline flex-shrink-0"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          placeholder="Type the student's name..."
          className={inputCls}
        />
        {open && term.length >= 2 && students.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {students.map((s) => {
              const cls = [s.class?.name, s.section?.name].filter(Boolean).join(' - ');
              return (
                <li
                  key={s._id}
                  className="px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer text-sm"
                  onClick={() => {
                    setOpen(false);
                    onSelect?.({ studentId: s._id, label: studentOptionLabel(s), student: s });
                  }}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {s.user?.name || 'Student'}
                    {!s.isActive && (
                      <span className="ml-2 text-xs text-gray-500 capitalize">
                        ({s.academicStatus || 'left'})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {s.admissionNumber || '—'}
                    {cls ? ` · ${cls}` : ''}
                    {s.branch?.name ? ` · ${s.branch.name}` : ''}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {open && term.length >= 2 && data && !isFetching && students.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No students found.</p>
        )}
        <PickerError error={error} />
      </div>
      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={left}
          onChange={(e) => setLeft(e.target.checked)}
          className="rounded"
        />
        Search students who have left (for a character certificate)
      </label>
    </div>
  );
}
