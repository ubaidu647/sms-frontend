// Shared display helpers for the billing screens.

export const fmtMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-';

// Status pill colour map shared by subscription views.
export const SUB_STATUS_COLORS = {
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  upgraded: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  downgraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

// Effective limit = customLimits?.X ?? computedLimits.X
export const effectiveLimit = (sub, key) =>
  sub?.customLimits?.[key] ?? sub?.computedLimits?.[key] ?? null;

// Invoice status pill colours.
export const INVOICE_STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  void: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

// Validate a grace-period input. Blank is allowed (means "use default/carry-over").
// Mirrors the backend: whole number, >= 0. Returns an error string, or '' when ok.
export const validateGraceDays = (raw) => {
  if (raw === '' || raw == null) return '';
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    return 'Grace period must be a whole number of days (0 or more).';
  }
  return '';
};

// Hard-block cutoff = endDate + gracePeriodInDays. Returns a Date, or null.
export const graceCutoff = (endDate, graceDays) => {
  if (!endDate) return null;
  const d = new Date(endDate);
  if (Number.isNaN(d.getTime())) return null;
  const g = Math.max(0, Number(graceDays) || 0);
  return new Date(d.getTime() + g * 24 * 60 * 60 * 1000);
};
