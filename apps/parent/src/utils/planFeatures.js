// Plan add-on modules the portal can hide. The school's plan says which add-ons
// it includes through `features` on GET /subscription/me/status: an array of
// the ENABLED add-on keys, or null when every module is open. Anything not
// listed here is core and always shown.
//
// Fail open: while the status loads, when the call fails, or when the answer
// is not understood, every module counts as enabled. The API still refuses a
// disabled module (403 PLAN_FEATURE_DISABLED); hiding is only cosmetic.

export const PLAN_FEATURE_KEYS = [
  "admissions",
  "certificates",
  "library",
  "inventory",
  "leave",
  "staff-attendance",
  "staff-salary",
  "transport",
  "accounting",
  "whatsapp",
];

export const PLAN_FEATURE_DISABLED = "PLAN_FEATURE_DISABLED";

export const FEATURE_UNAVAILABLE_MESSAGE =
  "This feature is not available for your school.";

// Portal pages that belong to an add-on module.
const PATH_FEATURES = [
  ["/dashboard/library", "library"],
  ["/dashboard/leave", "leave"],
];

/**
 * The enabled add-on keys from a status payload (`data` of the response), or
 * null for "all enabled" (null/missing `features`, or anything malformed).
 */
export function enabledFeaturesOf(status) {
  const features = status?.features;
  if (!Array.isArray(features)) return null;
  return features.filter((f) => PLAN_FEATURE_KEYS.includes(f));
}

/** Whether `key` is open under `features` (null = all open; core always open). */
export function isFeatureEnabled(features, key) {
  if (!Array.isArray(features)) return true;
  if (!PLAN_FEATURE_KEYS.includes(key)) return true;
  return features.includes(key);
}

/** The add-on module a portal path belongs to, or null for a core page. */
export function featureForPath(pathname) {
  const path = String(pathname || "").replace(/\/+$/, "");
  for (const [prefix, key] of PATH_FEATURES) {
    if (path === prefix || path.startsWith(prefix + "/")) return key;
  }
  return null;
}

/** Nav items without the ones whose module the plan leaves out. */
export function visibleNavItems(items, features) {
  return items.filter((item) => {
    const key = item.feature ?? featureForPath(item.path);
    return !key || isFeatureEnabled(features, key);
  });
}

/** True when `err` is the API refusing a module the plan does not include. */
export function isFeatureDisabledError(err) {
  return (
    err?.response?.status === 403 &&
    err.response.data?.code === PLAN_FEATURE_DISABLED
  );
}
