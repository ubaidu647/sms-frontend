// The plan's add-on module catalogue (mirror of sms-backend
// src/shared/planFeatures.ts). A package's `features` list says which add-ons
// a school on that plan may use; core modules are always included.
//
// What a stored list means:
//   - names at least one known key (a module key or `core`) → only the named
//     add-ons are open;
//   - empty, or only legacy free text naming no known key → every module open.
// The form always saves `core` with the ticked modules, so "no add-ons" is
// `['core']`, never `[]`.

export const CORE_FEATURE = 'core';

// Grouped for the package form; `key` is the backend feature key, the label
// comes from the `planModules.modules.<key>` message.
export const PLAN_MODULE_GROUPS = [
  { id: 'academic', keys: ['admissions', 'certificates', 'library', 'leave'] },
  { id: 'staff', keys: ['staff-attendance', 'staff-salary'] },
  { id: 'operations', keys: ['transport', 'inventory', 'accounting', 'whatsapp'] },
];

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

const KNOWN = new Set([CORE_FEATURE, ...PLAN_FEATURE_KEYS]);

/**
 * The add-on modules a stored `features` list opens, in catalogue order, or
 * null when it opens all of them (empty / legacy list / missing).
 */
export function enabledPlanFeatures(features) {
  if (!Array.isArray(features) || !features.some((f) => KNOWN.has(f))) return null;
  return PLAN_FEATURE_KEYS.filter((k) => features.includes(k));
}

/** The modules to tick when the form opens: all of them for a legacy list. */
export function checkedModulesFor(features) {
  return enabledPlanFeatures(features) ?? [...PLAN_FEATURE_KEYS];
}

/** The `features` value to save for the ticked modules. */
export function featuresPayload(checked) {
  const set = new Set(checked || []);
  return [CORE_FEATURE, ...PLAN_FEATURE_KEYS.filter((k) => set.has(k))];
}
