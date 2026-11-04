// Pure helpers for the admin home page's "Getting started" checklist.
// Imported by node tests, so keep imports relative with .js extensions.
import { hasAnyAction } from './permissions.js';

/** A list endpoint's row count: `total` when the API sends it, else the page length. */
export function countOf(res) {
  if (!res) return 0;
  if (typeof res.total === 'number') return res.total;
  return Array.isArray(res.data) ? res.data.length : 0;
}

/** Sections across a /class/list page (each class row carries `sectionCount`). */
export function sectionCountOf(res) {
  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows.reduce((sum, c) => sum + (Number(c?.sectionCount) || 0), 0);
}

/**
 * GET /branch-profile/me answers a profile, null ("No profile yet"), or — for
 * an org-level account with no branch — every branch's profile.
 */
export function hasBranchProfile(res) {
  const data = res?.data;
  if (Array.isArray(data)) return data.length > 0;
  return !!data;
}

/**
 * The checklist steps. Each step names the actions that may read its source
 * (`needs`) — a step the user cannot check is hidden, not shown as pending.
 */
export const CHECKLIST_STEPS = [
  {
    key: 'branchProfile',
    label: 'Set up your branch profile',
    hint: 'Name, logo and contact details used on vouchers, reports and certificates.',
    href: '/dashboard/business-settings/branches/profile',
    needs: ['view-branch-profile', 'view-all-branch-profile'],
  },
  {
    key: 'classes',
    label: 'Create classes and sections',
    hint: 'Every student is enrolled into a section of a class.',
    href: '/dashboard/school/classes',
    needs: ['view-class', 'view-all-branch-class'],
  },
  {
    key: 'subjects',
    label: 'Add subjects',
    hint: 'Used by the timetable, homework and exams.',
    href: '/dashboard/school/subjects',
    needs: ['view-subject', 'view-all-branch-subject'],
  },
  {
    key: 'staff',
    label: 'Add staff',
    hint: 'Teachers and office staff, each with their own login.',
    href: '/dashboard/user-management/staff',
    needs: ['view-staff', 'view-all-branch-staff'],
  },
  {
    key: 'students',
    label: 'Add students',
    hint: 'Enrol students one by one or through admissions.',
    href: '/dashboard/school/students',
    needs: ['view-student', 'view-all-branch-student'],
  },
  {
    key: 'feeStructure',
    label: 'Create a fee structure',
    hint: 'What each class pays — vouchers are generated from it.',
    href: '/dashboard/school/fees/structures',
    needs: ['view-fee', 'view-all-branch-fee'],
  },
  {
    key: 'cashAccount',
    label: 'Give every branch a cash account',
    hint: 'Auto-posting is on: cash payments are refused in a branch without one.',
    href: '/dashboard/school/accounting/accounts',
    needs: ['view-account-mapping', 'view-all-branch-account-mapping'],
  },
];

/** The steps this role may check. */
export function visibleSteps(role) {
  return CHECKLIST_STEPS.filter((s) => hasAnyAction(role, s.needs));
}

/**
 * Turn the fetched sources into checklist rows.
 *
 * `results` maps a step key to `{ status: 'loading' | 'error' | 'ok', value }`
 * (value = whatever the step's source resolved to). A failed or forbidden
 * source leaves the step out rather than claiming it pending; the cash step
 * only appears while auto-posting is on.
 */
export function buildChecklist(role, results = {}) {
  const rows = [];
  for (const step of visibleSteps(role)) {
    const r = results[step.key];
    if (!r || r.status === 'error') continue;
    if (r.status === 'loading') {
      rows.push({ ...step, state: 'loading' });
      continue;
    }
    const v = r.value;
    let done = false;
    let detail = '';
    switch (step.key) {
      case 'branchProfile':
        done = hasBranchProfile(v);
        break;
      case 'classes': {
        const classes = countOf(v);
        const sections = sectionCountOf(v);
        done = classes > 0 && sections > 0;
        detail = `${classes} class${classes === 1 ? '' : 'es'}, ${sections} section${
          sections === 1 ? '' : 's'
        }`;
        break;
      }
      case 'cashAccount': {
        const data = v?.data;
        if (!data?.autoPostEnabled) continue; // only relevant with auto-post on
        const missing = Array.isArray(data.missingCash) ? data.missingCash : [];
        done = missing.length === 0;
        detail = done
          ? 'Every branch has one'
          : `Missing in: ${missing.map((b) => b?.name || 'a branch').join(', ')}`;
        break;
      }
      default: {
        const n = countOf(v);
        done = n > 0;
        detail = n > 0 ? `${n} so far` : '';
      }
    }
    rows.push({ ...step, state: done ? 'done' : 'pending', detail });
  }
  return rows;
}

/** Quick links, each shown only to a role that may open the screen. */
export const QUICK_LINKS = [
  {
    label: 'Students',
    href: '/dashboard/school/students',
    needs: ['view-student', 'view-all-branch-student'],
  },
  {
    label: 'Fee vouchers',
    href: '/dashboard/school/fees/vouchers',
    needs: ['view-fee', 'view-all-branch-fee'],
  },
  {
    label: 'Attendance',
    href: '/dashboard/school/attendance',
    needs: ['view-attendance', 'view-all-branch-attendance'],
  },
  {
    label: 'Staff',
    href: '/dashboard/user-management/staff',
    needs: ['view-staff', 'view-all-branch-staff'],
  },
  {
    label: 'Classes',
    href: '/dashboard/school/classes',
    needs: ['view-class', 'view-all-branch-class'],
  },
  {
    label: 'Chart of accounts',
    href: '/dashboard/school/accounting/accounts',
    needs: ['view-account', 'view-all-branch-account'],
  },
  { label: 'Change password', href: '/dashboard/settings/password', needs: null },
];

export function visibleQuickLinks(role) {
  return QUICK_LINKS.filter((l) => !l.needs || hasAnyAction(role, l.needs));
}
