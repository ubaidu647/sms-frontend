// Plan add-ons bought on top of a plan, mid-period: extra units of a limit
// (students, branches, staff, sections, storage GB) or one gated module.
// Mirrors sms-backend/src/modules/subscription/subscription.addons.ts; the
// server stays authoritative.

// [limit key, label, singular unit, plural unit]
export const ADDON_RESOURCES = [
  ['noOfStudents', 'Students', 'student', 'students'],
  ['noOfBranches', 'Branches', 'branch', 'branches'],
  ['noOfStaffs', 'Staff', 'staff member', 'staff'],
  ['noOfSections', 'Sections', 'section', 'sections'],
  ['storageGB', 'Storage (GB)', 'GB of storage', 'GB of storage'],
];

export const ADDON_KEYS = ADDON_RESOURCES.map(([key]) => key);

// The countable limits (shown as a grid of numbers); storage has its own bar.
export const COUNT_RESOURCES = ADDON_RESOURCES.filter(([key]) => key !== 'storageGB');

// `resource` of a module add-on (always quantity 1).
export const MODULE_RESOURCE = 'module';

// The gated modules a plan may leave out, in the package form's order, with
// the names the backend uses ("WhatsApp module").
export const MODULE_LABELS = {
  admissions: 'Admissions',
  certificates: 'Certificates',
  library: 'Library',
  inventory: 'Inventory & shop',
  leave: 'Leave management',
  'staff-attendance': 'Staff attendance',
  'staff-salary': 'Staff salary',
  transport: 'Transport',
  accounting: 'Accounting',
  whatsapp: 'WhatsApp',
};

export const MODULE_KEYS = Object.keys(MODULE_LABELS);

export const moduleLabel = (key) => MODULE_LABELS[key] ?? key ?? 'module';

const unitsOf = (resource) => ADDON_RESOURCES.find(([key]) => key === resource);

/** "+100 students" / "+5 GB of storage" / "WhatsApp module" */
export const addonLabel = (resource, quantity, module) => {
  if (resource === MODULE_RESOURCE) return `${moduleLabel(module)} module`;
  const row = unitsOf(resource);
  const unit = row ? row[quantity === 1 ? 2 : 3] : resource;
  return `+${quantity} ${unit}`;
};

/** An add-on row's label. */
export const addonText = (a) => addonLabel(a?.resource, a?.quantity, a?.module);

/** "WhatsApp module @ Rs 1,000" / "+100 students @ Rs 10" (`fmt` formats money). */
export const addonSummary = (a, fmt) => `${addonText(a)} @ ${fmt(a?.unitPrice)}`;

/** "Extra student" / "Extra branch" … */
export const addonUnitName = (resource) => {
  if (resource === 'storageGB') return 'GB';
  const row = unitsOf(resource);
  return row ? row[2] : resource;
};

/**
 * Extra units per limit. The current-subscription read sends `addonLimits`;
 * a history row only has the stored `addons`, so sum those.
 */
export const addonTotals = (sub) => {
  if (sub?.addonLimits && typeof sub.addonLimits === 'object') return sub.addonLimits;
  const totals = {};
  for (const a of sub?.addons ?? []) {
    if (!a?.resource || a.resource === MODULE_RESOURCE) continue;
    totals[a.resource] = (totals[a.resource] ?? 0) + (Number(a.quantity) || 0);
  }
  return totals;
};

/** The limit before add-ons: the per-school override, else the plan's. */
export const baseLimit = (sub, key) =>
  sub?.customLimits?.[key] ?? sub?.computedLimits?.[key] ?? null;

/**
 * Effective limit = (customLimits[k] ?? computedLimits[k]) + addonLimits[k].
 * null (no limit on record) stays null unless add-ons give some units.
 */
export const effectiveLimit = (sub, key) => {
  const base = baseLimit(sub, key);
  const extra = Number(addonTotals(sub)[key]) || 0;
  if (base == null) return extra > 0 ? extra : null;
  return base + extra;
};

/* ---------------------------- Package form ---------------------------- */

// Form field name for an add-on price input.
export const addonPriceField = (key) => `addon_${key}`;

// Label of an add-on price input in the package form.
export const addonPriceLabel = (key) =>
  key === 'storageGB' ? 'Extra GB' : (unitsOf(key)?.[1] ?? key);

/** Package → form values: one string per price ('' when not listed). */
export const addonPricesToForm = (pkg) =>
  Object.fromEntries(
    ADDON_KEYS.map((key) => {
      const v = pkg?.addonPrices?.[key];
      return [addonPriceField(key), v == null ? '' : String(v)];
    }),
  );

/** Form values → `addonPrices` payload. Blank → null (the plan lists no such add-on). */
export const addonPricesFromForm = (values) =>
  Object.fromEntries(
    ADDON_KEYS.map((key) => {
      const raw = values?.[addonPriceField(key)];
      if (raw === '' || raw == null) return [key, null];
      const n = Number(raw);
      return [key, Number.isFinite(n) ? n : null];
    }),
  );

/** The priced add-ons of a price map, in display order: [{ key, price }]. */
export const pricedAddons = (prices) =>
  ADDON_KEYS.filter((key) => prices?.[key] != null && Number.isFinite(Number(prices[key]))).map(
    (key) => ({ key, price: Number(prices[key]) }),
  );

/* ------------------------- Module add-on prices ------------------------- */

// Form field name for a module's add-on price input.
export const modulePriceField = (key) => `modaddon_${key}`;

/** Package → form values: one string per module ('' when not listed). */
export const modulePricesToForm = (pkg) =>
  Object.fromEntries(
    MODULE_KEYS.map((key) => {
      const v = pkg?.moduleAddonPrices?.[key];
      return [modulePriceField(key), v == null ? '' : String(v)];
    }),
  );

/**
 * Form values → `moduleAddonPrices`. Blank → null (not sold as an add-on); a
 * module the plan already includes (`included`) is null too, since it can't
 * be bought on top of that plan.
 */
export const modulePricesFromForm = (values, included = []) => {
  const inPlan = new Set(included ?? []);
  return Object.fromEntries(
    MODULE_KEYS.map((key) => {
      const raw = values?.[modulePriceField(key)];
      if (inPlan.has(key) || raw === '' || raw == null) return [key, null];
      const n = Number(raw);
      return [key, Number.isFinite(n) ? n : null];
    }),
  );
};

/** The priced modules of a price map, in catalogue order: [{ key, price }]. */
export const pricedModules = (prices) =>
  MODULE_KEYS.filter((key) => prices?.[key] != null && Number.isFinite(Number(prices[key]))).map(
    (key) => ({ key, price: Number(prices[key]) }),
  );

/** The module keys opened by a subscription's add-ons. */
export const addonModulesOf = (sub) => {
  if (Array.isArray(sub?.addonModules)) return sub.addonModules;
  return [
    ...new Set(
      (sub?.addons ?? [])
        .filter((a) => a?.resource === MODULE_RESOURCE && a.module)
        .map((a) => a.module),
    ),
  ];
};

/* ------------------------------ Invoices ------------------------------ */

const idOf = (v) => String(v?._id ?? v ?? '');

/** Invoices keyed by id. */
export const invoicesById = (invoices) =>
  Object.fromEntries((invoices ?? []).map((inv) => [idOf(inv), inv]));

/**
 * The plan invoice of a subscription: its newest invoice that is not an
 * add-on bill (GET /invoice/subscription/:id returns the newest of any type).
 */
export const planInvoiceFor = (invoices, subscriptionId) => {
  const id = idOf(subscriptionId);
  const own = (invoices ?? []).filter(
    (inv) => idOf(inv.subscriptionId) === id && inv.type !== 'addon',
  );
  own.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return own[0] ?? null;
};

/** A subscription's invoices, newest first. */
export const invoicesForSubscription = (invoices, subscriptionId) => {
  const id = idOf(subscriptionId);
  return (invoices ?? [])
    .filter((inv) => idOf(inv.subscriptionId) === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Only an add-on billed on its own, still-unpaid `addon` invoice can be
 * removed (its invoice is voided). One carried over on a plan invoice, or
 * already paid, cannot. `byId` undefined → statuses not loaded → false.
 */
export const canRemoveAddon = (addon, byId) => {
  if (!byId || !addon?.invoiceId) return false;
  const inv = byId[idOf(addon.invoiceId)];
  return !!inv && inv.type === 'addon' && inv.status === 'unpaid';
};

/** The invoice an add-on was billed on, if known. */
export const addonInvoice = (addon, byId) =>
  byId && addon?.invoiceId ? (byId[idOf(addon.invoiceId)] ?? null) : null;

/* ------------------------------ Quote form ------------------------------ */

/**
 * Validate the add-on form and build the request body, or return an error.
 * `unitPrice` is sent only when it differs from the plan's price (or the plan
 * lists none). → { body } | { error }
 */
export const addonRequest = ({
  schoolId,
  resource,
  module,
  quantity,
  unitPrice,
  defaultUnitPrice,
}) => {
  let body;
  if (resource === MODULE_RESOURCE) {
    if (!MODULE_KEYS.includes(module)) return { error: 'Choose a module.' };
    // A module is always one unit: no quantity is sent.
    body = { schoolId, resource, module };
  } else {
    if (!ADDON_KEYS.includes(resource)) return { error: 'Choose what to add.' };
    const q = Number(quantity);
    if (!Number.isInteger(q) || q < 1 || q > 100000) {
      return { error: 'Quantity must be a whole number from 1 to 100000.' };
    }
    body = { schoolId, resource, quantity: q };
  }
  if (unitPrice === '' || unitPrice == null) {
    if (defaultUnitPrice == null) {
      return { error: 'This plan lists no price for this add-on: enter a unit price.' };
    }
    return { body };
  }
  const p = Number(unitPrice);
  if (!Number.isFinite(p) || p < 0) return { error: 'Unit price must be 0 or more.' };
  if (defaultUnitPrice == null || p !== Number(defaultUnitPrice)) body.unitPrice = p;
  return { body };
};
