// Plan add-ons as the school sees them: extra units of a limit (students,
// branches, staff, sections, storage GB) or a gated module the platform admin
// added on top of the plan. Mirrors sms-backend/src/modules/subscription/
// subscription.addons.ts.

// The countable limits, shown as a grid of numbers.
export const ADDON_KEYS = ['noOfStudents', 'noOfBranches', 'noOfStaffs', 'noOfSections'];

// Every limit with an add-on price (storage has its own card).
export const PRICED_LIMIT_KEYS = [...ADDON_KEYS, 'storageGB'];

// `resource` of a module add-on (always one unit).
export const MODULE_RESOURCE = 'module';

/** True for a module add-on row. */
export const isModuleAddon = (a) => a?.resource === MODULE_RESOURCE;

/**
 * Extra units per limit. GET /subscription/me/current sends `addonLimits`; a
 * history row only has the stored `addons`, so sum those.
 */
export const addonTotals = (sub) => {
  if (sub?.addonLimits && typeof sub.addonLimits === 'object') return sub.addonLimits;
  const totals = {};
  for (const a of sub?.addons ?? []) {
    if (!a?.resource || isModuleAddon(a)) continue;
    totals[a.resource] = (totals[a.resource] ?? 0) + (Number(a.quantity) || 0);
  }
  return totals;
};

/** The limit before add-ons: the per-school override, else the plan's. */
export const baseLimit = (sub, key) =>
  sub?.customLimits?.[key] ?? sub?.computedLimits?.[key] ?? null;

/** Add-on units for one limit (0 when none). */
export const addonUnits = (sub, key) => Number(addonTotals(sub)[key]) || 0;

/**
 * Effective limit = (customLimits[k] ?? computedLimits[k]) + addonLimits[k].
 * null (no limit on record) stays null unless add-ons give some units.
 */
export const effectiveLimit = (sub, key) => {
  const base = baseLimit(sub, key);
  const extra = addonUnits(sub, key);
  if (base == null) return extra > 0 ? extra : null;
  return base + extra;
};

/** The priced add-ons of a price map, in display order: [{ key, price }]. */
export const pricedAddons = (prices) =>
  PRICED_LIMIT_KEYS.filter(
    (key) => prices?.[key] != null && Number.isFinite(Number(prices[key])),
  ).map((key) => ({ key, price: Number(prices[key]) }));

/**
 * The modules the school could still buy, each with its per-period price
 * (null when the plan lists none): [{ key, price }]. From the current read's
 * `buyableModules` and `moduleAddonPrices`.
 */
export const buyableModuleOffers = (sub) =>
  (Array.isArray(sub?.buyableModules) ? sub.buyableModules : []).map((key) => {
    const p = sub?.moduleAddonPrices?.[key];
    return { key, price: p != null && Number.isFinite(Number(p)) ? Number(p) : null };
  });

/** The module keys the school's add-ons opened. */
export const addonModulesOf = (sub) => {
  if (Array.isArray(sub?.addonModules)) return sub.addonModules;
  return [
    ...new Set(
      (sub?.addons ?? [])
        .filter(isModuleAddon)
        .map((a) => a.module)
        .filter(Boolean),
    ),
  ];
};

/** The subscription's launch-offer price lock while it runs, else null. */
export const livePriceLock = (sub, nowMs = Date.now()) => {
  const lock = sub?.priceLock;
  if (!lock || lock.price == null || !lock.until) return null;
  const until = new Date(lock.until).getTime();
  return Number.isFinite(until) && until > nowMs ? { price: Number(lock.price), until } : null;
};
