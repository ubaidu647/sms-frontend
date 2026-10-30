// Leave management — pure helpers shared by the management page (/leave), the
// self-service page (/my-leave) and the attendance registers. Imported by node
// tests, so keep relative imports with explicit .js extensions.

import { parseStartMonth } from './academicYear.js';

export const STAFF_LEAVE_TYPES = ['casual', 'sick', 'annual', 'unpaid', 'other'];
export const STUDENT_LEAVE_TYPES = ['sick', 'casual', 'other'];
/** Leave types with a yearly quota (unpaid never uses quota). */
export const QUOTA_LEAVE_TYPES = ['casual', 'sick', 'annual', 'other'];
export const LEAVE_STAFF_TYPES = ['teaching', 'non-teaching'];
export const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

export const LEAVE_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export const LEAVE_TYPE_LABELS = {
  casual: 'Casual',
  sick: 'Sick',
  annual: 'Annual',
  unpaid: 'Unpaid',
  other: 'Other',
};

export const POLICY_SOURCE_LABELS = {
  branch: 'Branch policy',
  school: 'School default',
  none: 'Not set (all zero)',
};

/** Max calendar span of one request (backend rejects longer). */
export const MAX_LEAVE_SPAN_DAYS = 60;
export const REASON_MIN = 3;
export const REASON_MAX = 500;

/** Leave types valid for an applicant type ('staff' | 'student'). */
export function leaveTypesFor(applicantType) {
  return applicantType === 'student' ? STUDENT_LEAVE_TYPES : STAFF_LEAVE_TYPES;
}

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a real calendar `YYYY-MM-DD` into a UTC timestamp; null if invalid. */
export function parseYMDUtc(ymd) {
  const m = YMD_RE.exec(String(ymd ?? ''));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const t = Date.UTC(y, mo, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo || back.getUTCDate() !== d) {
    return null;
  }
  return t;
}

const DAY_MS = 86400000;

/** Inclusive calendar-day span from..to; 0 when invalid or reversed. */
export function calendarSpan(from, to) {
  const a = parseYMDUtc(from);
  const b = parseYMDUtc(to);
  if (a == null || b == null || b < a) return 0;
  return Math.round((b - a) / DAY_MS) + 1;
}

/**
 * Leave year (academic year "YYYY-YYYY") a date belongs to, using the same
 * start month as the backend. '' when the date is invalid.
 */
export function leaveYearOf(ymd, startMonth) {
  const m = YMD_RE.exec(String(ymd ?? ''));
  if (!m || parseYMDUtc(ymd) == null) return '';
  const y = Number(m[1]);
  const month = Number(m[2]);
  const start = month >= parseStartMonth(startMonth) ? y : y - 1;
  return `${start}-${start + 1}`;
}

/**
 * Client-side date checks mirroring the backend (from ≤ to, span ≤ 60 days,
 * same leave year). Returns an error message or '' when valid.
 */
export function validateLeaveDates(from, to, startMonth) {
  if (parseYMDUtc(from) == null) return 'Pick a valid start date';
  if (parseYMDUtc(to) == null) return 'Pick a valid end date';
  const span = calendarSpan(from, to);
  if (span === 0) return 'End date must be on or after the start date';
  if (span > MAX_LEAVE_SPAN_DAYS) return `A request can span at most ${MAX_LEAVE_SPAN_DAYS} days`;
  if (leaveYearOf(from, startMonth) !== leaveYearOf(to, startMonth)) {
    return 'A request cannot span two leave years — split it in two';
  }
  return '';
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const DEFAULT_WORKING_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Number of working days in from..to (inclusive). `workingDays` is a list of
 * weekday keys ('mon'…'sun'); defaults to Mon–Sat like the backend fallback.
 * Only a hint — the server computes the authoritative count per branch.
 */
export function countWorkingDays(from, to, workingDays = DEFAULT_WORKING_DAYS) {
  const span = calendarSpan(from, to);
  if (!span) return 0;
  const set = new Set(
    (workingDays?.length ? workingDays : DEFAULT_WORKING_DAYS).map((d) =>
      String(d).slice(0, 3).toLowerCase(),
    ),
  );
  const start = parseYMDUtc(from);
  let n = 0;
  for (let i = 0; i < span; i++) {
    const wd = new Date(start + i * DAY_MS).getUTCDay();
    if (set.has(WEEKDAY_KEYS[wd])) n++;
  }
  return n;
}

/** Stored date-only value (UTC midnight ISO) → 'YYYY-MM-DD'; '' when missing. */
export function leaveDateYMD(iso) {
  if (!iso) return '';
  const s = String(iso);
  if (YMD_RE.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** Human date range: "2026-10-12" or "2026-10-12 → 2026-10-14". */
export function formatLeaveRange(from, to) {
  const a = leaveDateYMD(from);
  const b = leaveDateYMD(to);
  if (!a) return '—';
  return !b || a === b ? a : `${a} → ${b}`;
}

/**
 * Query params for GET /leave from the page's filter state — drops empty
 * values and fields that don't apply to the chosen applicant type.
 */
export function buildLeaveListParams(filters = {}) {
  const out = {};
  const put = (k, v) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = String(v).trim();
  };
  put('applicantType', filters.applicantType);
  put('status', filters.status);
  put('branchId', filters.branchId);
  put('from', filters.from);
  put('to', filters.to);
  if (filters.applicantType !== 'student') put('staffId', filters.staffId);
  if (filters.applicantType !== 'staff') {
    put('studentId', filters.studentId);
    put('classId', filters.classId);
    put('sectionId', filters.sectionId);
  }
  return out;
}

/**
 * Row actions available for a request. `canApprove` = the caller holds an
 * approve grant reaching this request. Approve/reject only while pending;
 * cancel while pending or approved.
 */
export function leaveRowActions(request, { canApprove = false } = {}) {
  const status = request?.status;
  const out = ['view'];
  if (!canApprove) return out;
  if (status === 'pending') out.push('approve', 'reject');
  if (status === 'pending' || status === 'approved') out.push('cancel');
  return out;
}

/** A staff member may cancel only their own PENDING requests. */
export function canCancelOwn(request) {
  return request?.status === 'pending';
}

/** Coerces a quota input to a non-negative integer (invalid → null). */
export function parseQuota(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  return n;
}

/** Quotas object from form values; returns { quotas } or { error }. */
export function buildQuotas(values = {}) {
  const quotas = {};
  for (const type of QUOTA_LEAVE_TYPES) {
    const n = parseQuota(values[type]);
    if (n === null) return { error: `${LEAVE_TYPE_LABELS[type]} must be a whole number ≥ 0` };
    quotas[type] = n;
  }
  return { quotas };
}

/** Policy entry for a staff type from GET /leave/policy data (zero quotas if absent). */
export function policyFor(data, staffType) {
  const found = (data?.policies || []).find((p) => p.staffType === staffType);
  const quotas = {};
  for (const type of QUOTA_LEAVE_TYPES) quotas[type] = Number(found?.quotas?.[type]) || 0;
  return { staffType, quotas, source: found?.source || 'none' };
}

/**
 * Is this register row an approved-leave row (written by a leave request)?
 * Works with the daily-register `attendance` object.
 */
export function isLeaveRequestRow(attendance) {
  return !!attendance && attendance.status === 'leave' && !!attendance.leaveRequestId;
}

/**
 * Rows this save changes to `absent` on a day an approved leave holds — the
 * server keeps those as leave instead of marking them absent. Computed from the
 * loaded roster vs the submitted entries, so rows that simply stay on leave
 * (the usual case) are not counted. `idKey` is 'studentId' or 'staffId'.
 */
export function keptAsLeaveCount(roster, entries, idKey) {
  const onLeave = new Set();
  for (const row of Array.isArray(roster) ? roster : []) {
    if (row && isLeaveRequestRow(row.attendance) && row[idKey] != null) {
      onLeave.add(String(row[idKey]));
    }
  }
  let n = 0;
  for (const e of Array.isArray(entries) ? entries : []) {
    if (e?.status === 'absent' && onLeave.has(String(e[idKey]))) n++;
  }
  return n;
}

/** Toast text for {@link keptAsLeaveCount}, or '' when none. */
export function keptAsLeaveMessage(n) {
  return n > 0 ? `${n} on approved leave ${n === 1 ? 'was' : 'were'} kept as leave` : '';
}

/** `warnings: string[]` from a response envelope (on `data` or the envelope). */
export function responseWarnings(res) {
  const w = res?.data?.warnings ?? res?.warnings;
  return Array.isArray(w) ? w.filter((x) => typeof x === 'string' && x) : [];
}

/** Applicant display name for a request row. */
export function applicantName(request) {
  return request?.applicant?.name || '—';
}

/** Secondary line for an applicant: designation, or class/section + admission #. */
export function applicantDetail(request) {
  const a = request?.applicant;
  if (!a) return '';
  if (a.kind === 'staff') return a.designation || '';
  const cls = [a.className, a.sectionName].filter(Boolean).join(' - ');
  return [cls, a.admissionNumber].filter(Boolean).join(' · ');
}

/** "Requested by" label from `requestedBy.role`. */
export function requestedByLabel(request) {
  const role = request?.requestedBy?.role;
  if (role === 'self') return 'Self';
  if (role === 'parent') return 'Parent';
  if (role === 'staff') return request?.requestedBy?.name || 'Staff';
  return '—';
}
