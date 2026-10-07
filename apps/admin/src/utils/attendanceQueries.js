/** Cached student-attendance views derived from the daily registers. */
export const STUDENT_ATTENDANCE_DERIVED_KEYS = [
  'attendance-summary',
  'attendance-unmarked',
  'own-student-attendance',
];

/** Cached staff-attendance views derived from the daily registers. */
export const STAFF_ATTENDANCE_DERIVED_KEYS = [
  'staff-attendance-summary',
  'staff-attendance-unmarked-branches',
  'own-staff-attendance',
];

/** After marking student attendance: monthly summary, unmarked list, own view. */
export function invalidateStudentAttendanceQueries(queryClient) {
  for (const key of STUDENT_ATTENDANCE_DERIVED_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}

/** After marking staff attendance: monthly summary, unmarked branches, own view. */
export function invalidateStaffAttendanceQueries(queryClient) {
  for (const key of STAFF_ATTENDANCE_DERIVED_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
}
