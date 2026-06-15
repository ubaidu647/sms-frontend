// Per-module endpoint map. Each entry exposes:
//   base       — the base view action (input to resolveScope)
//   branchUrl  — endpoint when scope is 'all' or 'branch'
//   ownUrl     — endpoint when scope is 'own' (server enforces ownership)
//
// Pages call useScopedUrl('payslip', { ...params }) and get back the right URL
// for the current user's scope, or null if they have no access.

import { resolveScope } from './permissions';

export const SCOPE_MAP = {
  'staff-attendance': {
    base: 'view-staff-attendance',
    branchUrl: ({ branchId, date } = {}) =>
      `/staff-attendance/branch/daily?branchId=${branchId || ''}&date=${date || ''}`,
    ownUrl: ({ staffId, from, to } = {}) =>
      `/staff-attendance/staff/${staffId}/history?from=${from || ''}&to=${to || ''}`,
  },
  payslip: {
    base: 'view-payslip',
    branchUrl: () => '/staff-salary/payslip',
    ownUrl: () => '/staff-salary/payslip',
  },
  staff: {
    base: 'view-staff',
    branchUrl: () => '/staff/list',
    ownUrl: ({ staffId } = {}) => `/staff/${staffId}`,
  },
  student: {
    base: 'view-student',
    branchUrl: () => '/student/list',
    ownUrl: ({ studentId } = {}) => `/student/${studentId}`,
  },
  attendance: {
    base: 'view-attendance',
    branchUrl: ({ sectionId, date } = {}) =>
      `/attendance/section/daily?sectionId=${sectionId || ''}&date=${date || ''}`,
    ownUrl: ({ studentId, from, to } = {}) =>
      `/attendance/student/${studentId}/history?from=${from || ''}&to=${to || ''}`,
  },
  'teaching-assignment': {
    base: 'view-teaching-assignment',
    branchUrl: () => '/teaching-assignment/list',
    ownUrl: () => '/teaching-assignment/list',
  },
  timetable: {
    base: 'view-timetable',
    branchUrl: ({ sectionId } = {}) => `/timetable/section/${sectionId || ''}`,
    ownUrl: ({ user } = {}) =>
      user?.type === 'staff'
        ? `/timetable/teacher/${user.staffId}`
        : `/timetable/section/${user?.sectionId}`,
  },
  fee: {
    base: 'view-fee',
    branchUrl: () => '/fee/voucher/list',
    ownUrl: () => '/fee/voucher/list',
  },
  payment: {
    base: 'view-payment',
    branchUrl: () => '/fee/payment/list',
    ownUrl: () => '/fee/payment/list',
  },
  'transport-assignment': {
    base: 'view-transport-assignment',
    branchUrl: () => '/transport/assignment',
    ownUrl: () => '/transport/assignment',
  },
  'salary-structure': {
    base: 'view-staff-salary',
    branchUrl: () => '/staff-salary/structure',
    ownUrl: ({ staffId } = {}) => `/staff-salary/structure/staff/${staffId}`,
  },
  'result-card': {
    base: 'view-marks',
    branchUrl: ({ examId, studentId } = {}) => `/exam/${examId}/result-card/${studentId}`,
    ownUrl: ({ examId, user } = {}) => `/exam/${examId}/result-card/${user?.studentId}`,
  },
};

// Resolves the right URL for the current user's scope. Returns null when the
// user has no access (caller can render an unauthorized state).
export const buildScopedUrl = (key, role, user, params = {}) => {
  const cfg = SCOPE_MAP[key];
  if (!cfg) return null;
  const scope = resolveScope(role, cfg.base);
  if (scope === 'none') return null;
  if (scope === 'own') return cfg.ownUrl({ ...params, ...(user || {}), user });
  return cfg.branchUrl({ ...params, ...(user || {}) });
};
