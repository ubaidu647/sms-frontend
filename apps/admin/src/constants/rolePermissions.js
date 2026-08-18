export const ACTIONS = {
  // ── Role management ──────────────────────────────
  CREATE_ROLE: 'create-role',
  VIEW_ROLE: 'view-role',
  UPDATE_ROLE: 'update-role',
  DELETE_ROLE: 'delete-role',

  // ── Role management (org-level) ───────────────────
  CREATE_ALL_BRANCH_ROLE: 'create-all-branch-role',
  VIEW_ALL_BRANCH_ROLE: 'view-all-branch-role',
  UPDATE_ALL_BRANCH_ROLE: 'update-all-branch-role',
  DELETE_ALL_BRANCH_ROLE: 'delete-all-branch-role',

  // ── Staff management ─────────────────────────────
  CREATE_STAFF: 'create-staff',
  VIEW_STAFF: 'view-staff',
  UPDATE_STAFF: 'update-staff',
  DELETE_STAFF: 'delete-staff',

  // ── Staff management (org-level) ─────────────────
  CREATE_ALL_BRANCH_STAFF: 'create-all-branch-staff',
  VIEW_ALL_BRANCH_STAFF: 'view-all-branch-staff',
  UPDATE_ALL_BRANCH_STAFF: 'update-all-branch-staff',
  DELETE_ALL_BRANCH_STAFF: 'delete-all-branch-staff',

  // ── Branch management ─────────────────────────────
  CREATE_BRANCH: 'create-branch',
  VIEW_BRANCH: 'view-branch',
  UPDATE_BRANCH: 'update-branch',
  DELETE_BRANCH: 'delete-branch',

  // ── Branch profile (logo, stamp, principal info, social links) ────
  CREATE_BRANCH_PROFILE: 'create-branch-profile',
  VIEW_BRANCH_PROFILE: 'view-branch-profile',
  UPDATE_BRANCH_PROFILE: 'update-branch-profile',
  DELETE_BRANCH_PROFILE: 'delete-branch-profile',

  // ── Branch profile (org-level — across all branches) ──────────────
  CREATE_ALL_BRANCH_PROFILE: 'create-all-branch-profile',
  VIEW_ALL_BRANCH_PROFILE: 'view-all-branch-profile',
  UPDATE_ALL_BRANCH_PROFILE: 'update-all-branch-profile',
  DELETE_ALL_BRANCH_PROFILE: 'delete-all-branch-profile',

  // ── Class management ─────────────────────────────
  CREATE_CLASS: 'create-class',
  VIEW_CLASS: 'view-class',
  UPDATE_CLASS: 'update-class',
  DELETE_CLASS: 'delete-class',

  // ── Class management (org-level) ──────────────────
  CREATE_ALL_BRANCH_CLASS: 'create-all-branch-class',
  VIEW_ALL_BRANCH_CLASS: 'view-all-branch-class',
  UPDATE_ALL_BRANCH_CLASS: 'update-all-branch-class',
  DELETE_ALL_BRANCH_CLASS: 'delete-all-branch-class',

  // ── Subject management ───────────────────────────
  CREATE_SUBJECT: 'create-subject',
  VIEW_SUBJECT: 'view-subject',
  UPDATE_SUBJECT: 'update-subject',
  DELETE_SUBJECT: 'delete-subject',

  // ── Subject management (org-level) ────────────────
  CREATE_ALL_BRANCH_SUBJECT: 'create-all-branch-subject',
  VIEW_ALL_BRANCH_SUBJECT: 'view-all-branch-subject',
  UPDATE_ALL_BRANCH_SUBJECT: 'update-all-branch-subject',
  DELETE_ALL_BRANCH_SUBJECT: 'delete-all-branch-subject',

  // ── Student management ────────────────────────────
  CREATE_STUDENT: 'create-student',
  VIEW_STUDENT: 'view-student',
  UPDATE_STUDENT: 'update-student',
  DELETE_STUDENT: 'delete-student',

  // ── Student management (org-level) ────────────────
  CREATE_ALL_BRANCH_STUDENT: 'create-all-branch-student',
  VIEW_ALL_BRANCH_STUDENT: 'view-all-branch-student',
  UPDATE_ALL_BRANCH_STUDENT: 'update-all-branch-student',
  DELETE_ALL_BRANCH_STUDENT: 'delete-all-branch-student',

  // ── Attendance ────────────────────────────────────
  MARK_ATTENDANCE: 'mark-attendance',
  VIEW_ATTENDANCE: 'view-attendance',
  UPDATE_ATTENDANCE: 'update-attendance',

  // ── Attendance (org-level) ────────────────────────
  MARK_ALL_BRANCH_ATTENDANCE: 'mark-all-branch-attendance',
  VIEW_ALL_BRANCH_ATTENDANCE: 'view-all-branch-attendance',
  UPDATE_ALL_BRANCH_ATTENDANCE: 'update-all-branch-attendance',

  // ── Staff attendance ──────────────────────────────
  MARK_STAFF_ATTENDANCE: 'mark-staff-attendance',
  VIEW_STAFF_ATTENDANCE: 'view-staff-attendance',
  UPDATE_STAFF_ATTENDANCE: 'update-staff-attendance',

  // ── Staff attendance (org-level) ──────────────────
  MARK_ALL_BRANCH_STAFF_ATTENDANCE: 'mark-all-branch-staff-attendance',
  VIEW_ALL_BRANCH_STAFF_ATTENDANCE: 'view-all-branch-staff-attendance',
  UPDATE_ALL_BRANCH_STAFF_ATTENDANCE: 'update-all-branch-staff-attendance',

  // ── Teaching assignment ───────────────────────────
  CREATE_TEACHING_ASSIGNMENT: 'create-teaching-assignment',
  VIEW_TEACHING_ASSIGNMENT: 'view-teaching-assignment',
  UPDATE_TEACHING_ASSIGNMENT: 'update-teaching-assignment',
  DELETE_TEACHING_ASSIGNMENT: 'delete-teaching-assignment',

  // ── Teaching assignment (org-level) ───────────────
  CREATE_ALL_BRANCH_TEACHING_ASSIGNMENT: 'create-all-branch-teaching-assignment',
  VIEW_ALL_BRANCH_TEACHING_ASSIGNMENT: 'view-all-branch-teaching-assignment',
  UPDATE_ALL_BRANCH_TEACHING_ASSIGNMENT: 'update-all-branch-teaching-assignment',
  DELETE_ALL_BRANCH_TEACHING_ASSIGNMENT: 'delete-all-branch-teaching-assignment',

  // ── Exams / Marks ─────────────────────────────────
  CREATE_EXAM: 'create-exam',
  VIEW_EXAM: 'view-exam',
  UPDATE_EXAM: 'update-exam',
  DELETE_EXAM: 'delete-exam',
  PUBLISH_EXAM: 'publish-exam',
  ENTER_MARKS: 'enter-marks',
  VIEW_MARKS: 'view-marks',

  // ── Exams / Marks (org-level) ─────────────────────
  CREATE_ALL_BRANCH_EXAM: 'create-all-branch-exam',
  VIEW_ALL_BRANCH_EXAM: 'view-all-branch-exam',
  UPDATE_ALL_BRANCH_EXAM: 'update-all-branch-exam',
  DELETE_ALL_BRANCH_EXAM: 'delete-all-branch-exam',
  ENTER_ALL_BRANCH_MARKS: 'enter-all-branch-marks',
  VIEW_ALL_BRANCH_MARKS: 'view-all-branch-marks',

  // ── Homework ──────────────────────────────────────
  CREATE_HOMEWORK: 'create-homework',
  VIEW_HOMEWORK: 'view-homework',
  UPDATE_HOMEWORK: 'update-homework',
  DELETE_HOMEWORK: 'delete-homework',
  GRADE_HOMEWORK: 'grade-homework',

  // ── Homework (org-level) ──────────────────────────
  CREATE_ALL_BRANCH_HOMEWORK: 'create-all-branch-homework',
  VIEW_ALL_BRANCH_HOMEWORK: 'view-all-branch-homework',
  UPDATE_ALL_BRANCH_HOMEWORK: 'update-all-branch-homework',
  DELETE_ALL_BRANCH_HOMEWORK: 'delete-all-branch-homework',
  GRADE_ALL_BRANCH_HOMEWORK: 'grade-all-branch-homework',

  // ── Timetable ─────────────────────────────────────
  CREATE_TIMETABLE: 'create-timetable',
  VIEW_TIMETABLE: 'view-timetable',
  UPDATE_TIMETABLE: 'update-timetable',
  DELETE_TIMETABLE: 'delete-timetable',

  // ── Timetable (org-level) ─────────────────────────
  CREATE_ALL_BRANCH_TIMETABLE: 'create-all-branch-timetable',
  VIEW_ALL_BRANCH_TIMETABLE: 'view-all-branch-timetable',
  UPDATE_ALL_BRANCH_TIMETABLE: 'update-all-branch-timetable',
  DELETE_ALL_BRANCH_TIMETABLE: 'delete-all-branch-timetable',

  // ── Fees ──────────────────────────────────────────
  CREATE_FEE: 'create-fee',
  VIEW_FEE: 'view-fee',
  UPDATE_FEE: 'update-fee',
  DELETE_FEE: 'delete-fee',
  GENERATE_VOUCHER: 'generate-voucher',
  RECORD_PAYMENT: 'record-payment',
  VIEW_PAYMENT: 'view-payment',
  VOID_PAYMENT: 'void-payment',

  // ── Fees (org-level) ──────────────────────────────
  CREATE_ALL_BRANCH_FEE: 'create-all-branch-fee',
  VIEW_ALL_BRANCH_FEE: 'view-all-branch-fee',
  UPDATE_ALL_BRANCH_FEE: 'update-all-branch-fee',
  DELETE_ALL_BRANCH_FEE: 'delete-all-branch-fee',
  GENERATE_ALL_BRANCH_VOUCHER: 'generate-all-branch-voucher',
  RECORD_ALL_BRANCH_PAYMENT: 'record-all-branch-payment',
  VIEW_ALL_BRANCH_PAYMENT: 'view-all-branch-payment',
  VOID_ALL_BRANCH_PAYMENT: 'void-all-branch-payment',

  // ── Accounting: chart of accounts ─────────────────
  CREATE_ACCOUNT: 'create-account',
  VIEW_ACCOUNT: 'view-account',
  UPDATE_ACCOUNT: 'update-account',
  DELETE_ACCOUNT: 'delete-account',

  // ── Accounting: chart of accounts (org-level) ─────
  CREATE_ALL_BRANCH_ACCOUNT: 'create-all-branch-account',
  VIEW_ALL_BRANCH_ACCOUNT: 'view-all-branch-account',
  UPDATE_ALL_BRANCH_ACCOUNT: 'update-all-branch-account',
  DELETE_ALL_BRANCH_ACCOUNT: 'delete-all-branch-account',

  // ── Accounting: journal entries ───────────────────
  CREATE_JOURNAL: 'create-journal',
  VIEW_JOURNAL: 'view-journal',
  VOID_JOURNAL: 'void-journal',

  // ── Accounting: journal entries (org-level) ───────
  CREATE_ALL_BRANCH_JOURNAL: 'create-all-branch-journal',
  VIEW_ALL_BRANCH_JOURNAL: 'view-all-branch-journal',
  VOID_ALL_BRANCH_JOURNAL: 'void-all-branch-journal',

  // ── Accounting: account mapping (auto-post config) ─
  VIEW_ACCOUNT_MAPPING: 'view-account-mapping',
  UPDATE_ACCOUNT_MAPPING: 'update-account-mapping',
  VIEW_ALL_BRANCH_ACCOUNT_MAPPING: 'view-all-branch-account-mapping',
  UPDATE_ALL_BRANCH_ACCOUNT_MAPPING: 'update-all-branch-account-mapping',

  // ── Accounting: financial reports ─────────────────
  VIEW_FINANCIAL_REPORT: 'view-financial-report',
  VIEW_ALL_BRANCH_FINANCIAL_REPORT: 'view-all-branch-financial-report',

  // ── Accounting: period locking ────────────────────
  VIEW_ACCOUNTING_PERIOD: 'view-accounting-period',
  MANAGE_ACCOUNTING_PERIOD: 'manage-accounting-period',
  VIEW_ALL_BRANCH_ACCOUNTING_PERIOD: 'view-all-branch-accounting-period',
  MANAGE_ALL_BRANCH_ACCOUNTING_PERIOD: 'manage-all-branch-accounting-period',

  // ── Reports ───────────────────────────────────────
  STUDENT_DEFAULTS_LIST_VIEW: 'student-defaults-list-view',
  STUDENT_DEFAULTS_LIST_VIEW_ALL_BRANCH: 'student-defaults-list-view-all-branch',

  // ── Announcements ─────────────────────────────────
  CREATE_ANNOUNCEMENT: 'create-announcement',
  VIEW_ANNOUNCEMENT: 'view-announcement',
  UPDATE_ANNOUNCEMENT: 'update-announcement',
  DELETE_ANNOUNCEMENT: 'delete-announcement',
  PUBLISH_ANNOUNCEMENT: 'publish-announcement',

  // ── Announcements (org-level) ─────────────────────
  CREATE_ALL_BRANCH_ANNOUNCEMENT: 'create-all-branch-announcement',
  VIEW_ALL_BRANCH_ANNOUNCEMENT: 'view-all-branch-announcement',
  UPDATE_ALL_BRANCH_ANNOUNCEMENT: 'update-all-branch-announcement',
  DELETE_ALL_BRANCH_ANNOUNCEMENT: 'delete-all-branch-announcement',

  // ── Transport: vehicles ───────────────────────────
  CREATE_VEHICLE: 'create-vehicle',
  VIEW_VEHICLE: 'view-vehicle',
  UPDATE_VEHICLE: 'update-vehicle',
  DELETE_VEHICLE: 'delete-vehicle',

  // ── Transport: routes ─────────────────────────────
  CREATE_ROUTE: 'create-route',
  VIEW_ROUTE: 'view-route',
  UPDATE_ROUTE: 'update-route',
  DELETE_ROUTE: 'delete-route',

  // ── Transport: student assignment ─────────────────
  ASSIGN_TRANSPORT: 'assign-transport',
  VIEW_TRANSPORT_ASSIGNMENT: 'view-transport-assignment',
  UPDATE_TRANSPORT_ASSIGNMENT: 'update-transport-assignment',
  REMOVE_TRANSPORT_ASSIGNMENT: 'remove-transport-assignment',

  // ── Transport (org-level) ─────────────────────────
  CREATE_ALL_BRANCH_VEHICLE: 'create-all-branch-vehicle',
  VIEW_ALL_BRANCH_VEHICLE: 'view-all-branch-vehicle',
  UPDATE_ALL_BRANCH_VEHICLE: 'update-all-branch-vehicle',
  DELETE_ALL_BRANCH_VEHICLE: 'delete-all-branch-vehicle',

  CREATE_ALL_BRANCH_ROUTE: 'create-all-branch-route',
  VIEW_ALL_BRANCH_ROUTE: 'view-all-branch-route',
  UPDATE_ALL_BRANCH_ROUTE: 'update-all-branch-route',
  DELETE_ALL_BRANCH_ROUTE: 'delete-all-branch-route',

  ASSIGN_ALL_BRANCH_TRANSPORT: 'assign-all-branch-transport',
  VIEW_ALL_BRANCH_TRANSPORT_ASSIGNMENT: 'view-all-branch-transport-assignment',
  UPDATE_ALL_BRANCH_TRANSPORT_ASSIGNMENT: 'update-all-branch-transport-assignment',
  REMOVE_ALL_BRANCH_TRANSPORT_ASSIGNMENT: 'remove-all-branch-transport-assignment',

  // ── Staff salary: structure ───────────────────────
  CREATE_STAFF_SALARY: 'create-staff-salary',
  VIEW_STAFF_SALARY: 'view-staff-salary',
  UPDATE_STAFF_SALARY: 'update-staff-salary',
  DELETE_STAFF_SALARY: 'delete-staff-salary',

  // ── Staff salary: payslips ────────────────────────
  GENERATE_PAYSLIP: 'generate-payslip',
  VIEW_PAYSLIP: 'view-payslip',
  UPDATE_PAYSLIP: 'update-payslip',
  PAY_PAYSLIP: 'pay-payslip',
  CANCEL_PAYSLIP: 'cancel-payslip',

  // ── Staff salary (org-level) ──────────────────────
  CREATE_ALL_BRANCH_STAFF_SALARY: 'create-all-branch-staff-salary',
  VIEW_ALL_BRANCH_STAFF_SALARY: 'view-all-branch-staff-salary',
  UPDATE_ALL_BRANCH_STAFF_SALARY: 'update-all-branch-staff-salary',
  DELETE_ALL_BRANCH_STAFF_SALARY: 'delete-all-branch-staff-salary',

  GENERATE_ALL_BRANCH_PAYSLIP: 'generate-all-branch-payslip',
  VIEW_ALL_BRANCH_PAYSLIP: 'view-all-branch-payslip',
  UPDATE_ALL_BRANCH_PAYSLIP: 'update-all-branch-payslip',
  PAY_ALL_BRANCH_PAYSLIP: 'pay-all-branch-payslip',
  CANCEL_ALL_BRANCH_PAYSLIP: 'cancel-all-branch-payslip',

  // ── Staff salary policy ───────────────────────────
  CREATE_STAFF_SALARY_POLICY: 'create-staff-salary-policy',
  VIEW_STAFF_SALARY_POLICY: 'view-staff-salary-policy',
  UPDATE_STAFF_SALARY_POLICY: 'update-staff-salary-policy',

  // ── Staff salary policy (org-level) ───────────────
  CREATE_ALL_BRANCH_STAFF_SALARY_POLICY: 'create-all-branch-staff-salary-policy',
  VIEW_ALL_BRANCH_STAFF_SALARY_POLICY: 'view-all-branch-staff-salary-policy',
  UPDATE_ALL_BRANCH_STAFF_SALARY_POLICY: 'update-all-branch-staff-salary-policy',

  // ── WhatsApp notifications (per-branch settings + session) ─
  VIEW_WHATSAPP_SETTINGS: 'view-whatsapp-settings',
  UPDATE_WHATSAPP_SETTINGS: 'update-whatsapp-settings',

  // ── WhatsApp notifications (org-level — across all branches) ─
  VIEW_ALL_BRANCH_WHATSAPP_SETTINGS: 'view-all-branch-whatsapp-settings',
  UPDATE_ALL_BRANCH_WHATSAPP_SETTINGS: 'update-all-branch-whatsapp-settings',

  // ── Billing & subscription (read-only self-serve) ─
  VIEW_BILLING: 'view-billing',

  // ── Self-scoped (own data only) ───────────────────
  VIEW_OWN_STAFF: 'view-own-staff',
  UPDATE_OWN_STAFF: 'update-own-staff',
  VIEW_OWN_SUBJECT: 'view-own-subject',
  VIEW_OWN_STAFF_ATTENDANCE: 'view-own-staff-attendance',
  VIEW_OWN_STAFF_SALARY: 'view-own-staff-salary',
  VIEW_OWN_PAYSLIP: 'view-own-payslip',
  VIEW_OWN_TEACHING_ASSIGNMENT: 'view-own-teaching-assignment',
  VIEW_OWN_STUDENT: 'view-own-student',
  VIEW_OWN_ATTENDANCE: 'view-own-attendance',
  VIEW_OWN_MARKS: 'view-own-marks',
  VIEW_OWN_FEE: 'view-own-fee',
  VIEW_OWN_PAYMENT: 'view-own-payment',
  VIEW_OWN_TRANSPORT_ASSIGNMENT: 'view-own-transport-assignment',
  VIEW_OWN_TIMETABLE: 'view-own-timetable',
};

export const AVAILABLE_MENUS = [
  // Branches, Branch Profile and WhatsApp are administered from Business
  // Settings (topbar), not the sidebar; the menu keys stay so their actions
  // remain grantable on a role.
  { key: 'branch', label: 'Business Settings — Branches' },
  { key: 'branch-profile', label: 'Business Settings — Branch Profile' },
  // Staff and Roles are administered from User Management (topbar), not the
  // sidebar; the menu keys stay so their actions remain grantable on a role.
  { key: 'staff', label: 'User Management — Staff' },
  { key: 'role', label: 'User Management — Roles' },
  { key: 'class', label: 'Classes' },
  { key: 'subject', label: 'Subjects' },
  { key: 'homework', label: 'Homework' },
  { key: 'student', label: 'Students' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'staff-attendance', label: 'Staff Attendance' },
  { key: 'teaching-assignment', label: 'Teacher Assignments' },
  { key: 'exam', label: 'Exams' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'fee', label: 'Fees' },
  { key: 'account', label: 'Accounting — Chart of Accounts' },
  { key: 'journal', label: 'Accounting — Journal Entries' },
  { key: 'account-mapping', label: 'Accounting — Account Mapping' },
  { key: 'financial-report', label: 'Accounting — Financial Reports' },
  { key: 'accounting-period', label: 'Accounting — Period Locking' },
  { key: 'announcement', label: 'Announcements' },
  { key: 'report', label: 'Reports' },
  { key: 'report-student-fee-defaulter', label: 'Reports — Student Fee Defaulter' },
  { key: 'report-student-progress', label: 'Reports — Student Progress' },
  { key: 'vehicle', label: 'Transport — Vehicles' },
  { key: 'route', label: 'Transport — Routes' },
  { key: 'transport-assignment', label: 'Transport — Assignments' },
  { key: 'salary-dashboard', label: 'Staff Salary — Dashboard' },
  { key: 'salary-structure', label: 'Staff Salary — Structures' },
  { key: 'payslip', label: 'Staff Salary — Payslips' },
  { key: 'salary-policy', label: 'Staff Salary — Policy' },
  { key: 'whatsapp', label: 'Business Settings — WhatsApp Notifications' },
  { key: 'billing', label: 'Billing' },
];

export const AVAILABLE_ACTIONS = [
  // Branch
  { key: ACTIONS.VIEW_BRANCH, label: 'View', menu: 'branch' },
  { key: ACTIONS.CREATE_BRANCH, label: 'Create', menu: 'branch' },
  { key: ACTIONS.UPDATE_BRANCH, label: 'Update', menu: 'branch' },
  { key: ACTIONS.DELETE_BRANCH, label: 'Delete', menu: 'branch' },

  // Branch Profile
  { key: ACTIONS.VIEW_BRANCH_PROFILE, label: 'View', menu: 'branch-profile' },
  { key: ACTIONS.CREATE_BRANCH_PROFILE, label: 'Create', menu: 'branch-profile' },
  { key: ACTIONS.UPDATE_BRANCH_PROFILE, label: 'Update', menu: 'branch-profile' },
  { key: ACTIONS.DELETE_BRANCH_PROFILE, label: 'Delete', menu: 'branch-profile' },
  { key: ACTIONS.VIEW_ALL_BRANCH_PROFILE, label: 'View All Branch', menu: 'branch-profile' },
  { key: ACTIONS.CREATE_ALL_BRANCH_PROFILE, label: 'Create All Branch', menu: 'branch-profile' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_PROFILE, label: 'Update All Branch', menu: 'branch-profile' },
  { key: ACTIONS.DELETE_ALL_BRANCH_PROFILE, label: 'Delete All Branch', menu: 'branch-profile' },

  // Staff
  { key: ACTIONS.VIEW_STAFF, label: 'View', menu: 'staff' },
  { key: ACTIONS.CREATE_STAFF, label: 'Create', menu: 'staff' },
  { key: ACTIONS.UPDATE_STAFF, label: 'Update', menu: 'staff' },
  { key: ACTIONS.DELETE_STAFF, label: 'Delete', menu: 'staff' },
  { key: ACTIONS.VIEW_ALL_BRANCH_STAFF, label: 'View All Branch', menu: 'staff' },
  { key: ACTIONS.CREATE_ALL_BRANCH_STAFF, label: 'Create All Branch', menu: 'staff' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_STAFF, label: 'Update All Branch', menu: 'staff' },
  { key: ACTIONS.DELETE_ALL_BRANCH_STAFF, label: 'Delete All Branch', menu: 'staff' },

  // Role
  { key: ACTIONS.VIEW_ROLE, label: 'View', menu: 'role' },
  { key: ACTIONS.CREATE_ROLE, label: 'Create', menu: 'role' },
  { key: ACTIONS.UPDATE_ROLE, label: 'Update', menu: 'role' },
  { key: ACTIONS.DELETE_ROLE, label: 'Delete', menu: 'role' },
  { key: ACTIONS.VIEW_ALL_BRANCH_ROLE, label: 'View All Branch', menu: 'role' },
  { key: ACTIONS.CREATE_ALL_BRANCH_ROLE, label: 'Create All Branch', menu: 'role' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_ROLE, label: 'Update All Branch', menu: 'role' },
  { key: ACTIONS.DELETE_ALL_BRANCH_ROLE, label: 'Delete All Branch', menu: 'role' },

  // Class
  { key: ACTIONS.VIEW_CLASS, label: 'View', menu: 'class' },
  { key: ACTIONS.CREATE_CLASS, label: 'Create', menu: 'class' },
  { key: ACTIONS.UPDATE_CLASS, label: 'Update', menu: 'class' },
  { key: ACTIONS.DELETE_CLASS, label: 'Delete', menu: 'class' },
  { key: ACTIONS.VIEW_ALL_BRANCH_CLASS, label: 'View All Branch', menu: 'class' },
  { key: ACTIONS.CREATE_ALL_BRANCH_CLASS, label: 'Create All Branch', menu: 'class' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_CLASS, label: 'Update All Branch', menu: 'class' },
  { key: ACTIONS.DELETE_ALL_BRANCH_CLASS, label: 'Delete All Branch', menu: 'class' },

  // Subject
  { key: ACTIONS.VIEW_SUBJECT, label: 'View', menu: 'subject' },
  { key: ACTIONS.CREATE_SUBJECT, label: 'Create', menu: 'subject' },
  { key: ACTIONS.UPDATE_SUBJECT, label: 'Update', menu: 'subject' },
  { key: ACTIONS.DELETE_SUBJECT, label: 'Delete', menu: 'subject' },
  { key: ACTIONS.VIEW_ALL_BRANCH_SUBJECT, label: 'View All Branch', menu: 'subject' },
  { key: ACTIONS.CREATE_ALL_BRANCH_SUBJECT, label: 'Create All Branch', menu: 'subject' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_SUBJECT, label: 'Update All Branch', menu: 'subject' },
  { key: ACTIONS.DELETE_ALL_BRANCH_SUBJECT, label: 'Delete All Branch', menu: 'subject' },

  // Homework
  { key: ACTIONS.VIEW_HOMEWORK, label: 'View', menu: 'homework' },
  { key: ACTIONS.CREATE_HOMEWORK, label: 'Create', menu: 'homework' },
  { key: ACTIONS.UPDATE_HOMEWORK, label: 'Update', menu: 'homework' },
  { key: ACTIONS.DELETE_HOMEWORK, label: 'Delete', menu: 'homework' },
  { key: ACTIONS.GRADE_HOMEWORK, label: 'Grade', menu: 'homework' },
  { key: ACTIONS.VIEW_ALL_BRANCH_HOMEWORK, label: 'View All Branch', menu: 'homework' },
  { key: ACTIONS.CREATE_ALL_BRANCH_HOMEWORK, label: 'Create All Branch', menu: 'homework' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_HOMEWORK, label: 'Update All Branch', menu: 'homework' },
  { key: ACTIONS.DELETE_ALL_BRANCH_HOMEWORK, label: 'Delete All Branch', menu: 'homework' },
  { key: ACTIONS.GRADE_ALL_BRANCH_HOMEWORK, label: 'Grade All Branch', menu: 'homework' },

  // Student
  { key: ACTIONS.VIEW_STUDENT, label: 'View', menu: 'student' },
  { key: ACTIONS.CREATE_STUDENT, label: 'Create', menu: 'student' },
  { key: ACTIONS.UPDATE_STUDENT, label: 'Update', menu: 'student' },
  { key: ACTIONS.DELETE_STUDENT, label: 'Delete', menu: 'student' },
  { key: ACTIONS.VIEW_ALL_BRANCH_STUDENT, label: 'View All Branch', menu: 'student' },
  { key: ACTIONS.CREATE_ALL_BRANCH_STUDENT, label: 'Create All Branch', menu: 'student' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_STUDENT, label: 'Update All Branch', menu: 'student' },
  { key: ACTIONS.DELETE_ALL_BRANCH_STUDENT, label: 'Delete All Branch', menu: 'student' },

  // Attendance
  { key: ACTIONS.MARK_ATTENDANCE, label: 'Mark', menu: 'attendance' },
  { key: ACTIONS.VIEW_ATTENDANCE, label: 'View', menu: 'attendance' },
  { key: ACTIONS.UPDATE_ATTENDANCE, label: 'Update', menu: 'attendance' },
  { key: ACTIONS.MARK_ALL_BRANCH_ATTENDANCE, label: 'Mark All Branch', menu: 'attendance' },
  { key: ACTIONS.VIEW_ALL_BRANCH_ATTENDANCE, label: 'View All Branch', menu: 'attendance' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_ATTENDANCE, label: 'Update All Branch', menu: 'attendance' },

  // Staff Attendance
  { key: ACTIONS.MARK_STAFF_ATTENDANCE, label: 'Mark', menu: 'staff-attendance' },
  { key: ACTIONS.VIEW_STAFF_ATTENDANCE, label: 'View', menu: 'staff-attendance' },
  { key: ACTIONS.UPDATE_STAFF_ATTENDANCE, label: 'Update', menu: 'staff-attendance' },
  {
    key: ACTIONS.MARK_ALL_BRANCH_STAFF_ATTENDANCE,
    label: 'Mark All Branch',
    menu: 'staff-attendance',
  },
  {
    key: ACTIONS.VIEW_ALL_BRANCH_STAFF_ATTENDANCE,
    label: 'View All Branch',
    menu: 'staff-attendance',
  },
  {
    key: ACTIONS.UPDATE_ALL_BRANCH_STAFF_ATTENDANCE,
    label: 'Update All Branch',
    menu: 'staff-attendance',
  },

  // Teacher Assignments (teacher–subject mapping)
  { key: ACTIONS.VIEW_TEACHING_ASSIGNMENT, label: 'View', menu: 'teaching-assignment' },
  { key: ACTIONS.CREATE_TEACHING_ASSIGNMENT, label: 'Assign', menu: 'teaching-assignment' },
  { key: ACTIONS.UPDATE_TEACHING_ASSIGNMENT, label: 'Update', menu: 'teaching-assignment' },
  { key: ACTIONS.DELETE_TEACHING_ASSIGNMENT, label: 'Remove', menu: 'teaching-assignment' },
  {
    key: ACTIONS.VIEW_ALL_BRANCH_TEACHING_ASSIGNMENT,
    label: 'View All Branch',
    menu: 'teaching-assignment',
  },
  {
    key: ACTIONS.CREATE_ALL_BRANCH_TEACHING_ASSIGNMENT,
    label: 'Assign All Branch',
    menu: 'teaching-assignment',
  },
  {
    key: ACTIONS.UPDATE_ALL_BRANCH_TEACHING_ASSIGNMENT,
    label: 'Update All Branch',
    menu: 'teaching-assignment',
  },
  {
    key: ACTIONS.DELETE_ALL_BRANCH_TEACHING_ASSIGNMENT,
    label: 'Remove All Branch',
    menu: 'teaching-assignment',
  },

  // Exams / Marks
  { key: ACTIONS.VIEW_EXAM, label: 'View', menu: 'exam' },
  { key: ACTIONS.CREATE_EXAM, label: 'Create', menu: 'exam' },
  { key: ACTIONS.UPDATE_EXAM, label: 'Update', menu: 'exam' },
  { key: ACTIONS.DELETE_EXAM, label: 'Delete', menu: 'exam' },
  { key: ACTIONS.PUBLISH_EXAM, label: 'Publish', menu: 'exam' },
  { key: ACTIONS.ENTER_MARKS, label: 'Enter Marks', menu: 'exam' },
  { key: ACTIONS.VIEW_MARKS, label: 'View Marks', menu: 'exam' },
  { key: ACTIONS.VIEW_ALL_BRANCH_EXAM, label: 'View All Branch', menu: 'exam' },
  { key: ACTIONS.CREATE_ALL_BRANCH_EXAM, label: 'Create All Branch', menu: 'exam' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_EXAM, label: 'Update All Branch', menu: 'exam' },
  { key: ACTIONS.DELETE_ALL_BRANCH_EXAM, label: 'Delete All Branch', menu: 'exam' },
  { key: ACTIONS.ENTER_ALL_BRANCH_MARKS, label: 'Enter All Branch Marks', menu: 'exam' },
  { key: ACTIONS.VIEW_ALL_BRANCH_MARKS, label: 'View All Branch Marks', menu: 'exam' },

  // Timetable
  { key: ACTIONS.VIEW_TIMETABLE, label: 'View', menu: 'timetable' },
  { key: ACTIONS.CREATE_TIMETABLE, label: 'Create', menu: 'timetable' },
  { key: ACTIONS.UPDATE_TIMETABLE, label: 'Update', menu: 'timetable' },
  { key: ACTIONS.DELETE_TIMETABLE, label: 'Delete', menu: 'timetable' },
  { key: ACTIONS.VIEW_ALL_BRANCH_TIMETABLE, label: 'View All Branch', menu: 'timetable' },
  { key: ACTIONS.CREATE_ALL_BRANCH_TIMETABLE, label: 'Create All Branch', menu: 'timetable' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_TIMETABLE, label: 'Update All Branch', menu: 'timetable' },
  { key: ACTIONS.DELETE_ALL_BRANCH_TIMETABLE, label: 'Delete All Branch', menu: 'timetable' },

  // Fees
  { key: ACTIONS.VIEW_FEE, label: 'View', menu: 'fee' },
  { key: ACTIONS.CREATE_FEE, label: 'Create', menu: 'fee' },
  { key: ACTIONS.UPDATE_FEE, label: 'Update', menu: 'fee' },
  { key: ACTIONS.DELETE_FEE, label: 'Delete', menu: 'fee' },
  { key: ACTIONS.GENERATE_VOUCHER, label: 'Generate Voucher', menu: 'fee' },
  { key: ACTIONS.RECORD_PAYMENT, label: 'Record Payment', menu: 'fee' },
  { key: ACTIONS.VIEW_PAYMENT, label: 'View Payment', menu: 'fee' },
  { key: ACTIONS.VOID_PAYMENT, label: 'Void Payment', menu: 'fee' },
  { key: ACTIONS.VIEW_ALL_BRANCH_FEE, label: 'View All Branch', menu: 'fee' },
  { key: ACTIONS.CREATE_ALL_BRANCH_FEE, label: 'Create All Branch', menu: 'fee' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_FEE, label: 'Update All Branch', menu: 'fee' },
  { key: ACTIONS.DELETE_ALL_BRANCH_FEE, label: 'Delete All Branch', menu: 'fee' },
  { key: ACTIONS.GENERATE_ALL_BRANCH_VOUCHER, label: 'Generate Voucher All Branch', menu: 'fee' },
  { key: ACTIONS.RECORD_ALL_BRANCH_PAYMENT, label: 'Record Payment All Branch', menu: 'fee' },
  { key: ACTIONS.VIEW_ALL_BRANCH_PAYMENT, label: 'View Payment All Branch', menu: 'fee' },
  { key: ACTIONS.VOID_ALL_BRANCH_PAYMENT, label: 'Void Payment All Branch', menu: 'fee' },

  // Accounting — Chart of Accounts
  { key: ACTIONS.VIEW_ACCOUNT, label: 'View', menu: 'account' },
  { key: ACTIONS.CREATE_ACCOUNT, label: 'Create', menu: 'account' },
  { key: ACTIONS.UPDATE_ACCOUNT, label: 'Update', menu: 'account' },
  { key: ACTIONS.DELETE_ACCOUNT, label: 'Delete', menu: 'account' },
  { key: ACTIONS.VIEW_ALL_BRANCH_ACCOUNT, label: 'View All Branch', menu: 'account' },
  { key: ACTIONS.CREATE_ALL_BRANCH_ACCOUNT, label: 'Create All Branch', menu: 'account' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_ACCOUNT, label: 'Update All Branch', menu: 'account' },
  { key: ACTIONS.DELETE_ALL_BRANCH_ACCOUNT, label: 'Delete All Branch', menu: 'account' },

  // Accounting — Journal Entries
  { key: ACTIONS.VIEW_JOURNAL, label: 'View', menu: 'journal' },
  { key: ACTIONS.CREATE_JOURNAL, label: 'Create', menu: 'journal' },
  { key: ACTIONS.VOID_JOURNAL, label: 'Void', menu: 'journal' },
  { key: ACTIONS.VIEW_ALL_BRANCH_JOURNAL, label: 'View All Branch', menu: 'journal' },
  { key: ACTIONS.CREATE_ALL_BRANCH_JOURNAL, label: 'Create All Branch', menu: 'journal' },
  { key: ACTIONS.VOID_ALL_BRANCH_JOURNAL, label: 'Void All Branch', menu: 'journal' },

  // Accounting — Account Mapping
  { key: ACTIONS.VIEW_ACCOUNT_MAPPING, label: 'View', menu: 'account-mapping' },
  { key: ACTIONS.UPDATE_ACCOUNT_MAPPING, label: 'Update', menu: 'account-mapping' },
  {
    key: ACTIONS.VIEW_ALL_BRANCH_ACCOUNT_MAPPING,
    label: 'View All Branch',
    menu: 'account-mapping',
  },
  {
    key: ACTIONS.UPDATE_ALL_BRANCH_ACCOUNT_MAPPING,
    label: 'Update All Branch',
    menu: 'account-mapping',
  },

  // Accounting — Financial Reports
  { key: ACTIONS.VIEW_FINANCIAL_REPORT, label: 'View', menu: 'financial-report' },
  {
    key: ACTIONS.VIEW_ALL_BRANCH_FINANCIAL_REPORT,
    label: 'View All Branch',
    menu: 'financial-report',
  },

  // Accounting — Period Locking
  { key: ACTIONS.VIEW_ACCOUNTING_PERIOD, label: 'View', menu: 'accounting-period' },
  {
    key: ACTIONS.MANAGE_ACCOUNTING_PERIOD,
    label: 'Manage (Close/Reopen)',
    menu: 'accounting-period',
  },
  {
    key: ACTIONS.VIEW_ALL_BRANCH_ACCOUNTING_PERIOD,
    label: 'View All Branch',
    menu: 'accounting-period',
  },
  {
    key: ACTIONS.MANAGE_ALL_BRANCH_ACCOUNTING_PERIOD,
    label: 'Manage All Branch',
    menu: 'accounting-period',
  },

  // Reports — Student Fee Defaulter
  {
    key: ACTIONS.STUDENT_DEFAULTS_LIST_VIEW,
    label: 'View Defaulters',
    menu: 'report-student-fee-defaulter',
  },
  {
    key: ACTIONS.STUDENT_DEFAULTS_LIST_VIEW_ALL_BRANCH,
    label: 'View Defaulters All Branch',
    menu: 'report-student-fee-defaulter',
  },

  // Announcements
  { key: ACTIONS.VIEW_ANNOUNCEMENT, label: 'View', menu: 'announcement' },
  { key: ACTIONS.CREATE_ANNOUNCEMENT, label: 'Create', menu: 'announcement' },
  { key: ACTIONS.UPDATE_ANNOUNCEMENT, label: 'Update', menu: 'announcement' },
  { key: ACTIONS.DELETE_ANNOUNCEMENT, label: 'Delete', menu: 'announcement' },
  { key: ACTIONS.PUBLISH_ANNOUNCEMENT, label: 'Publish', menu: 'announcement' },
  { key: ACTIONS.VIEW_ALL_BRANCH_ANNOUNCEMENT, label: 'View All Branch', menu: 'announcement' },
  { key: ACTIONS.CREATE_ALL_BRANCH_ANNOUNCEMENT, label: 'Create All Branch', menu: 'announcement' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_ANNOUNCEMENT, label: 'Update All Branch', menu: 'announcement' },
  { key: ACTIONS.DELETE_ALL_BRANCH_ANNOUNCEMENT, label: 'Delete All Branch', menu: 'announcement' },

  // Transport — Vehicles
  { key: ACTIONS.VIEW_VEHICLE, label: 'View', menu: 'vehicle' },
  { key: ACTIONS.CREATE_VEHICLE, label: 'Create', menu: 'vehicle' },
  { key: ACTIONS.UPDATE_VEHICLE, label: 'Update', menu: 'vehicle' },
  { key: ACTIONS.DELETE_VEHICLE, label: 'Delete', menu: 'vehicle' },
  { key: ACTIONS.VIEW_ALL_BRANCH_VEHICLE, label: 'View All Branch', menu: 'vehicle' },
  { key: ACTIONS.CREATE_ALL_BRANCH_VEHICLE, label: 'Create All Branch', menu: 'vehicle' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_VEHICLE, label: 'Update All Branch', menu: 'vehicle' },
  { key: ACTIONS.DELETE_ALL_BRANCH_VEHICLE, label: 'Delete All Branch', menu: 'vehicle' },

  // Transport — Routes
  { key: ACTIONS.VIEW_ROUTE, label: 'View', menu: 'route' },
  { key: ACTIONS.CREATE_ROUTE, label: 'Create', menu: 'route' },
  { key: ACTIONS.UPDATE_ROUTE, label: 'Update', menu: 'route' },
  { key: ACTIONS.DELETE_ROUTE, label: 'Delete', menu: 'route' },
  { key: ACTIONS.VIEW_ALL_BRANCH_ROUTE, label: 'View All Branch', menu: 'route' },
  { key: ACTIONS.CREATE_ALL_BRANCH_ROUTE, label: 'Create All Branch', menu: 'route' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_ROUTE, label: 'Update All Branch', menu: 'route' },
  { key: ACTIONS.DELETE_ALL_BRANCH_ROUTE, label: 'Delete All Branch', menu: 'route' },

  // Transport — Student Assignments
  { key: ACTIONS.VIEW_TRANSPORT_ASSIGNMENT, label: 'View', menu: 'transport-assignment' },
  { key: ACTIONS.ASSIGN_TRANSPORT, label: 'Assign', menu: 'transport-assignment' },
  { key: ACTIONS.UPDATE_TRANSPORT_ASSIGNMENT, label: 'Update', menu: 'transport-assignment' },
  { key: ACTIONS.REMOVE_TRANSPORT_ASSIGNMENT, label: 'Remove', menu: 'transport-assignment' },
  {
    key: ACTIONS.VIEW_ALL_BRANCH_TRANSPORT_ASSIGNMENT,
    label: 'View All Branch',
    menu: 'transport-assignment',
  },
  {
    key: ACTIONS.ASSIGN_ALL_BRANCH_TRANSPORT,
    label: 'Assign All Branch',
    menu: 'transport-assignment',
  },
  {
    key: ACTIONS.UPDATE_ALL_BRANCH_TRANSPORT_ASSIGNMENT,
    label: 'Update All Branch',
    menu: 'transport-assignment',
  },
  {
    key: ACTIONS.REMOVE_ALL_BRANCH_TRANSPORT_ASSIGNMENT,
    label: 'Remove All Branch',
    menu: 'transport-assignment',
  },

  // Staff Salary — Structures
  { key: ACTIONS.VIEW_STAFF_SALARY, label: 'View', menu: 'salary-structure' },
  { key: ACTIONS.CREATE_STAFF_SALARY, label: 'Create', menu: 'salary-structure' },
  { key: ACTIONS.UPDATE_STAFF_SALARY, label: 'Update', menu: 'salary-structure' },
  { key: ACTIONS.DELETE_STAFF_SALARY, label: 'Deactivate', menu: 'salary-structure' },
  { key: ACTIONS.VIEW_ALL_BRANCH_STAFF_SALARY, label: 'View All Branch', menu: 'salary-structure' },
  {
    key: ACTIONS.CREATE_ALL_BRANCH_STAFF_SALARY,
    label: 'Create All Branch',
    menu: 'salary-structure',
  },
  {
    key: ACTIONS.UPDATE_ALL_BRANCH_STAFF_SALARY,
    label: 'Update All Branch',
    menu: 'salary-structure',
  },
  {
    key: ACTIONS.DELETE_ALL_BRANCH_STAFF_SALARY,
    label: 'Deactivate All Branch',
    menu: 'salary-structure',
  },

  // Staff Salary — Policy
  { key: ACTIONS.VIEW_STAFF_SALARY_POLICY, label: 'View', menu: 'salary-policy' },
  { key: ACTIONS.CREATE_STAFF_SALARY_POLICY, label: 'Create', menu: 'salary-policy' },
  { key: ACTIONS.UPDATE_STAFF_SALARY_POLICY, label: 'Update', menu: 'salary-policy' },
  {
    key: ACTIONS.VIEW_ALL_BRANCH_STAFF_SALARY_POLICY,
    label: 'View All Branch',
    menu: 'salary-policy',
  },
  {
    key: ACTIONS.CREATE_ALL_BRANCH_STAFF_SALARY_POLICY,
    label: 'Create All Branch',
    menu: 'salary-policy',
  },
  {
    key: ACTIONS.UPDATE_ALL_BRANCH_STAFF_SALARY_POLICY,
    label: 'Update All Branch',
    menu: 'salary-policy',
  },

  // Staff Salary — Payslips
  { key: ACTIONS.VIEW_PAYSLIP, label: 'View', menu: 'payslip' },
  { key: ACTIONS.GENERATE_PAYSLIP, label: 'Generate', menu: 'payslip' },
  { key: ACTIONS.UPDATE_PAYSLIP, label: 'Edit/Finalize', menu: 'payslip' },
  { key: ACTIONS.PAY_PAYSLIP, label: 'Mark Paid', menu: 'payslip' },
  { key: ACTIONS.CANCEL_PAYSLIP, label: 'Cancel', menu: 'payslip' },
  { key: ACTIONS.VIEW_ALL_BRANCH_PAYSLIP, label: 'View All Branch', menu: 'payslip' },
  { key: ACTIONS.GENERATE_ALL_BRANCH_PAYSLIP, label: 'Generate All Branch', menu: 'payslip' },
  { key: ACTIONS.UPDATE_ALL_BRANCH_PAYSLIP, label: 'Edit All Branch', menu: 'payslip' },
  { key: ACTIONS.PAY_ALL_BRANCH_PAYSLIP, label: 'Mark Paid All Branch', menu: 'payslip' },
  { key: ACTIONS.CANCEL_ALL_BRANCH_PAYSLIP, label: 'Cancel All Branch', menu: 'payslip' },

  // Self-scoped (own data only) — admins should know these are weaker than branch-level grants
  { key: ACTIONS.VIEW_OWN_STAFF, label: 'View Own', menu: 'staff', scope: 'own' },
  { key: ACTIONS.UPDATE_OWN_STAFF, label: 'Update Own', menu: 'staff', scope: 'own' },
  { key: ACTIONS.VIEW_OWN_SUBJECT, label: 'View Own', menu: 'subject', scope: 'own' },
  { key: ACTIONS.VIEW_OWN_STUDENT, label: 'View Own', menu: 'student', scope: 'own' },
  { key: ACTIONS.VIEW_OWN_ATTENDANCE, label: 'View Own', menu: 'attendance', scope: 'own' },
  {
    key: ACTIONS.VIEW_OWN_STAFF_ATTENDANCE,
    label: 'View Own',
    menu: 'staff-attendance',
    scope: 'own',
  },
  {
    key: ACTIONS.VIEW_OWN_TEACHING_ASSIGNMENT,
    label: 'View Own',
    menu: 'teaching-assignment',
    scope: 'own',
  },
  { key: ACTIONS.VIEW_OWN_MARKS, label: 'View Own Marks', menu: 'exam', scope: 'own' },
  { key: ACTIONS.VIEW_OWN_TIMETABLE, label: 'View Own', menu: 'timetable', scope: 'own' },
  { key: ACTIONS.VIEW_OWN_FEE, label: 'View Own', menu: 'fee', scope: 'own' },
  { key: ACTIONS.VIEW_OWN_PAYMENT, label: 'View Own Payment', menu: 'fee', scope: 'own' },
  {
    key: ACTIONS.VIEW_OWN_TRANSPORT_ASSIGNMENT,
    label: 'View Own',
    menu: 'transport-assignment',
    scope: 'own',
  },
  { key: ACTIONS.VIEW_OWN_STAFF_SALARY, label: 'View Own', menu: 'salary-structure', scope: 'own' },
  { key: ACTIONS.VIEW_OWN_PAYSLIP, label: 'View Own', menu: 'payslip', scope: 'own' },

  // WhatsApp Notifications — branch-scoped settings + the unofficial QR session
  { key: ACTIONS.VIEW_WHATSAPP_SETTINGS, label: 'View', menu: 'whatsapp' },
  { key: ACTIONS.UPDATE_WHATSAPP_SETTINGS, label: 'Update', menu: 'whatsapp' },
  { key: ACTIONS.VIEW_ALL_BRANCH_WHATSAPP_SETTINGS, label: 'View All Branch', menu: 'whatsapp' },
  {
    key: ACTIONS.UPDATE_ALL_BRANCH_WHATSAPP_SETTINGS,
    label: 'Update All Branch',
    menu: 'whatsapp',
  },

  // Billing — read-only; paying/changing the plan stays super-admin only
  { key: ACTIONS.VIEW_BILLING, label: 'View', menu: 'billing' },
];
