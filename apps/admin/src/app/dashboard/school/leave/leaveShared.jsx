'use client';
// Shared bits for the Leave screens (styles, badges, cache invalidation).
import React from 'react';
import {
  invalidateStaffAttendanceQueries,
  invalidateStudentAttendanceQueries,
} from '@/utils/attendanceQueries';
import { LEAVE_STATUS_COLORS, LEAVE_TYPE_LABELS } from '@/utils/leave';

export const inputCls =
  'w-full bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-teal-500 disabled:opacity-60';

export const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1';

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const cardCls =
  'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4';

export const thCls =
  'text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide';
export const tdCls = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300';

export const errorCls = 'text-xs text-red-600 dark:text-red-400 mt-1';

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
        LEAVE_STATUS_COLORS[status] || LEAVE_STATUS_COLORS.cancelled
      }`}
    >
      {status || '—'}
    </span>
  );
}

export const leaveTypeLabel = (type) => LEAVE_TYPE_LABELS[type] || type || '—';

/** Paid/unpaid split for a staff request ("3 paid · 1 unpaid"). */
export function PaySplit({ request }) {
  if (request?.applicantType !== 'staff') return <span className="text-gray-400">—</span>;
  if (request.status !== 'approved') {
    return (
      <span className="text-xs text-gray-400">
        {request.leaveType === 'unpaid' ? 'Unpaid' : 'On approval'}
      </span>
    );
  }
  const paid = Number(request.paidDays) || 0;
  const unpaid = Number(request.unpaidDays) || 0;
  return (
    <span className="text-xs">
      <span className="text-green-700 dark:text-green-400 font-medium">{paid} paid</span>
      {unpaid > 0 && (
        <span className="text-red-700 dark:text-red-400 font-medium"> · {unpaid} unpaid</span>
      )}
    </span>
  );
}

/**
 * After a leave mutation: every leave view, plus the attendance registers and
 * payslips an approval/cancellation rewrites.
 */
export function invalidateLeaveData(queryClient, { attendance = false } = {}) {
  [['leave-requests'], ['leave-request'], ['leave-my'], ['leave-balance']].forEach((queryKey) =>
    queryClient.invalidateQueries({ queryKey }),
  );
  if (!attendance) return;
  invalidateStudentAttendanceQueries(queryClient);
  invalidateStaffAttendanceQueries(queryClient);
  [
    ['attendance-daily'],
    ['staff-attendance-daily'],
    ['payslips'],
    ['payslip-summary'],
    ['payslip-detail'],
  ].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

/** Toasts each server warning (e.g. a draft payslip needs regenerating). */
export function warningsOf(res) {
  const w = res?.warnings ?? res?.data?.warnings;
  return Array.isArray(w) ? w.filter(Boolean) : [];
}
