// Plan-based module gating — the client mirror of the backend's catalogue
// (sms-backend/src/shared/planFeatures.ts). A school's plan opens a set of
// ADD-ON modules; everything else (students, classes, fees, exams, …) is core
// and always on. The API stays authoritative: it refuses a disabled module
// with 403 `PLAN_FEATURE_DISABLED`. This file only decides what the menus,
// role forms and route guard show.
//
// `features` everywhere below is what GET /subscription/me/status returns:
// an array of the ENABLED add-on keys, or `null` meaning every module is open.
//
// Imported by node tests, so keep imports relative with .js extensions.
import { AVAILABLE_ACTIONS } from '../constants/rolePermissions.js';

export const PLAN_FEATURE_KEYS = [
  'admissions',
  'certificates',
  'library',
  'inventory',
  'leave',
  'staff-attendance',
  'staff-salary',
  'transport',
  'accounting',
  'whatsapp',
];

const KNOWN = new Set(PLAN_FEATURE_KEYS);

/** Machine-readable `code` of an API refusal because the plan lacks the module. */
export const PLAN_FEATURE_DISABLED = 'PLAN_FEATURE_DISABLED';

/** How the school's menus show a module its plan does not include. */
export const LOCKED_MODULE_DISPLAYS = ['lock', 'hide'];
export const DEFAULT_LOCKED_MODULE_DISPLAY = 'lock';

/** The school's `lockedModuleDisplay` setting, defaulting to 'lock'. */
export function lockedModuleDisplayOf(settings) {
  return settings?.lockedModuleDisplay === 'hide' ? 'hide' : DEFAULT_LOCKED_MODULE_DISPLAY;
}

/**
 * Role/sidebar menu key → the add-on module it belongs to. Keys not listed
 * are core. Covers AVAILABLE_MENUS (rolePermissions.js) and the sidebar's
 * parent keys (SideBar.jsx).
 */
export const MENU_FEATURE = {
  admissions: 'admissions',
  certificates: 'certificates',
  library: 'library',
  inventory: 'inventory',
  leave: 'leave',
  'my-leave': 'leave',
  'staff-attendance': 'staff-attendance',
  'staff-salary': 'staff-salary',
  'salary-dashboard': 'staff-salary',
  'salary-structure': 'staff-salary',
  payslip: 'staff-salary',
  'salary-policy': 'staff-salary',
  transport: 'transport',
  vehicle: 'transport',
  route: 'transport',
  'transport-assignment': 'transport',
  accounting: 'accounting',
  account: 'accounting',
  journal: 'accounting',
  'account-mapping': 'accounting',
  'financial-report': 'accounting',
  'accounting-period': 'accounting',
  whatsapp: 'whatsapp',
};

/** The add-on module a menu key belongs to, or null for a core menu. */
export function featureForMenu(menuKey) {
  return MENU_FEATURE[menuKey] || null;
}

/**
 * Dashboard route prefix → module. A path matches a prefix when it equals it
 * or continues with `/`, so `/dashboard/school/leave` never catches
 * `/dashboard/school/leaves-report`.
 */
export const ROUTE_FEATURE_PREFIXES = [
  ['/dashboard/school/admissions', 'admissions'],
  ['/dashboard/school/certificates', 'certificates'],
  ['/dashboard/school/library', 'library'],
  ['/dashboard/school/inventory', 'inventory'],
  ['/dashboard/school/leave', 'leave'],
  ['/dashboard/school/my-leave', 'leave'],
  ['/dashboard/school/staff-attendance', 'staff-attendance'],
  ['/dashboard/school/staff-salary', 'staff-salary'],
  ['/dashboard/school/transport', 'transport'],
  ['/dashboard/school/accounting', 'accounting'],
  ['/dashboard/business-settings/whatsapp', 'whatsapp'],
];

/** The add-on module a dashboard path belongs to, or null for a core screen. */
export function featureForPath(pathname) {
  const path = String(pathname || '')
    .split(/[?#]/)[0]
    .replace(/\/+$/, '');
  for (const [prefix, key] of ROUTE_FEATURE_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return key;
  }
  return null;
}

/**
 * The enabled-module list from a status payload: an array of known keys, or
 * null (= all open) when the server sent no list.
 */
export function normalizeFeatures(raw) {
  if (!Array.isArray(raw)) return null;
  return raw.filter((k) => KNOWN.has(k));
}

/**
 * Whether `key` is open. `null`/undefined features = all open; a key that is
 * not an add-on (or no key at all) is core and always open.
 */
export function isFeatureEnabled(features, key) {
  if (!key || !KNOWN.has(key)) return true;
  if (!Array.isArray(features)) return true;
  return features.includes(key);
}

/** Whether a menu key's module is in the plan. */
export function isMenuInPlan(menuKey, features) {
  return isFeatureEnabled(features, featureForMenu(menuKey));
}

// action key → its menu, from the catalogue (an action belongs to one menu).
const ACTION_MENU = new Map(AVAILABLE_ACTIONS.map((a) => [a.key, a.menu]));

/** Whether an action key's module is in the plan. Unknown actions count as core. */
export function isActionInPlan(actionKey, features) {
  return isMenuInPlan(ACTION_MENU.get(actionKey), features);
}

/** Catalogue menus (`{ key }` objects) whose module is in the plan. */
export function menusInPlan(menus, features) {
  return (menus || []).filter((m) => isMenuInPlan(m.key, features));
}

/** Catalogue actions (`{ key, menu }` objects) whose module is in the plan. */
export function actionsInPlan(actions, features) {
  return (actions || []).filter((a) => isMenuInPlan(a.menu, features));
}

/**
 * The menu and action keys a role holds for modules outside the plan —
 * granted before a downgrade. The role forms hide them but must keep them, so
 * an upgrade later brings the access back.
 */
export function outOfPlanGrants(role, features) {
  return {
    menus: (role?.menus || []).filter((m) => !isMenuInPlan(m, features)),
    actions: (role?.actions || []).filter((a) => !isActionInPlan(a, features)),
  };
}

const union = (a, b) => [...new Set([...(a || []), ...(b || [])])];

/**
 * `payload` with the role's out-of-plan menus/actions added back, so saving
 * an edited role never strips grants the form could not show.
 */
export function withPreservedGrants(payload, role, features) {
  const kept = outOfPlanGrants(role, features);
  return {
    ...payload,
    menus: union(payload?.menus, kept.menus),
    actions: union(payload?.actions, kept.actions),
  };
}

/**
 * How a gated entry shows: 'show' (in plan), 'lock' (out of plan, shown with
 * a lock) or 'hide' (out of plan, left out).
 */
export function gateState(features, key, display) {
  if (isFeatureEnabled(features, key)) return 'show';
  return display === 'hide' ? 'hide' : 'lock';
}
