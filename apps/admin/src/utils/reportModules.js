// Which student-progress-report modules the caller may include. Mirrors the
// gates in the backend's report.controller (POST /report/student-progress):
// each module is checked against its own view action, and the branch tier of
// that action only reaches students of the caller's own branch. Modules with
// no gate (transport, timetable, announcements) are always allowed.
//
// The backend applies further teacher-level narrowing (attendance only for
// sections they teach, etc.) that the client can't see; this only removes the
// choices that are certain to 403.

import { resolveScope, branchIdOf } from './permissions.js';

export const REPORT_MODULE_GATES = {
  attendance: 'view-attendance',
  exams: 'view-marks',
  homework: 'view-homework',
  fees: 'view-fee',
  transport: null,
  timetable: null,
  announcements: null,
};

/**
 * Set of module keys `role` may include for a student in `studentBranchId`
 * (unknown/empty = no student picked yet → only the permission is checked).
 */
export function allowedReportModules(role, { studentBranchId, userBranchId } = {}) {
  const allowed = new Set();
  const student = branchIdOf(studentBranchId);
  for (const [key, base] of Object.entries(REPORT_MODULE_GATES)) {
    if (!base) {
      allowed.add(key);
      continue;
    }
    const scope = resolveScope(role, base);
    if (scope === 'all') allowed.add(key);
    else if (scope === 'branch' && (!student || student === branchIdOf(userBranchId))) {
      allowed.add(key);
    }
  }
  return allowed;
}
