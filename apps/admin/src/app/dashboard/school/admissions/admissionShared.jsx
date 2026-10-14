'use client';
// Shared bits for the Admissions screens (styles, badges, pickers, cache invalidation).
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/tokenStore';
import { fetchData } from '@/utils/api';
import { STATUS_COLORS, statusLabel, staffName } from '@/utils/admission';

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

export const sectionHeadingCls =
  'text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3';

// Button component style objects (Button disables itself while loading).
export const modalPrimary = {
  baseColor: 'bg-teal-600',
  hoverColor: 'hover:bg-teal-700',
  rounded: 'rounded-full',
  size: 'px-8 py-3 text-md min-h-[3rem]',
  textColor: 'text-white',
};
export const modalSecondary = {
  baseColor: 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700',
  hoverColor: 'hover:bg-gray-50 dark:hover:bg-gray-800',
  rounded: 'rounded-full',
  size: 'px-8 py-3 text-md min-h-[3rem]',
  textColor: 'text-gray-700 dark:text-gray-300',
};

export function Field({ label, required, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
        STATUS_COLORS[status] || STATUS_COLORS.closed
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

export function Spinner() {
  return (
    <div className="py-10 flex justify-center">
      <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { timeZone: 'UTC', dateStyle: 'medium' });
};

export const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
};

/** Branch dropdown (org-tier). `allLabel` adds an empty "all" option. */
export function BranchSelect({ value, onChange, allLabel, disabled, className = inputCls }) {
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
      className={className}
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

/** Active staff dropdown, optionally limited to a branch. */
export function StaffSelect({ value, onChange, branchId, placeholder = 'Unassigned' }) {
  const { accessToken: token } = useTokenStore();
  const { data, isLoading } = useQuery({
    queryKey: ['admission-staff-options', branchId || ''],
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
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      <option value="">{isLoading ? 'Loading…' : placeholder}</option>
      {staff.map((s) => (
        <option key={s._id} value={s._id}>
          {staffName(s)}
        </option>
      ))}
    </select>
  );
}

/** After an enquiry mutation: every enquiry list, the detail and the summary cards. */
export function invalidateAdmissionData(queryClient, { students = false } = {}) {
  [['admission-enquiries'], ['admission-enquiry'], ['admission-summary']].forEach((queryKey) =>
    queryClient.invalidateQueries({ queryKey }),
  );
  if (students) queryClient.invalidateQueries({ queryKey: ['students'] });
}

/** Server warnings from a response envelope (`data.warnings` or top-level). */
export function warningsOf(res) {
  const w = res?.data?.warnings ?? res?.warnings;
  return Array.isArray(w) ? w.filter(Boolean) : [];
}
