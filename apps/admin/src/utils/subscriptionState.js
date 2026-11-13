// Client-side mirror of the backend's evaluateSubscription
// (sms-backend/src/modules/subscription/subscription.enforcement.ts). Keeping the
// rule here lets the UI show the grace/blocked state without depending on the
// X-Subscription-State response header (which CORS does not expose). The backend
// remains authoritative — it still blocks writes once past grace.
//
// States:
//   active   — within the paid period; full access, no warning
//   grace    — past endDate but within the grace window; warn, still allowed
//   expired  — past endDate + grace; hard-blocked
//   unpaid   — the plan's invoice passed its payment due date; read-only
//              (writes return 402) until the invoice is marked paid
//   cancelled— explicitly cancelled; hard-blocked
//   none     — no live subscription on record; hard-blocked

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const evaluateSubscription = (sub, nowMs = Date.now()) => {
  if (!sub) return { state: 'none', hardBlockAt: null, endDate: null };
  if (sub.status === 'cancelled') return { state: 'cancelled', hardBlockAt: null, endDate: null };

  const endDate = sub.endDate ? new Date(sub.endDate) : null;
  if (!endDate || Number.isNaN(endDate.getTime())) {
    return { state: 'none', hardBlockAt: null, endDate: null };
  }

  const endMs = endDate.getTime();
  const graceDays = Math.max(0, Number(sub.gracePeriodInDays) || 0);
  const hardBlockAt = new Date(endMs + graceDays * MS_PER_DAY);

  if (sub.status === 'expired' || nowMs > hardBlockAt.getTime()) {
    return { state: 'expired', hardBlockAt, endDate };
  }
  const paymentDueAt = toDate(sub.paymentDueAt);
  if (paymentDueAt && nowMs > paymentDueAt.getTime()) {
    return { state: 'unpaid', hardBlockAt, endDate, paymentDueAt };
  }
  if (nowMs > endMs) return { state: 'grace', hardBlockAt, endDate, paymentDueAt };
  return { state: 'active', hardBlockAt, endDate, paymentDueAt };
};

// Normalises the server-computed GET /subscription/me/status payload into the
// guard's shape. The server already evaluated the state; we only re-derive the
// active→grace→expired (and →unpaid) transitions from its dates so a long-open session crosses
// over without waiting for the next poll. Anything unrecognised → null (unknown,
// fail-open).
const KNOWN_STATES = ['active', 'grace', 'expired', 'unpaid', 'cancelled', 'none'];

export const fromStatusResponse = (status, nowMs = Date.now()) => {
  if (!status || !KNOWN_STATES.includes(status.state)) {
    return {
      state: null,
      endDate: null,
      hardBlockAt: null,
      paymentDueAt: null,
      packageName: null,
    };
  }
  const endDate = toDate(status.endDate);
  const hardBlockAt = toDate(status.hardBlockAt) || toDate(status.graceEndsAt);
  // Sent only while an invoice is owed and blocking is on.
  const paymentDueAt = toDate(status.paymentDueAt);
  let { state } = status;
  if (state === 'active' || state === 'grace' || state === 'unpaid') {
    // Same order as the backend: past grace beats an overdue invoice.
    if (hardBlockAt && nowMs > hardBlockAt.getTime()) state = 'expired';
    else if (paymentDueAt && nowMs > paymentDueAt.getTime()) state = 'unpaid';
    else if (state === 'active' && endDate && nowMs > endDate.getTime()) state = 'grace';
  }
  return { state, endDate, hardBlockAt, paymentDueAt, packageName: status.packageName ?? null };
};

// How many days ahead of an unpaid invoice's due date the warning shows.
export const PAYMENT_DUE_WARNING_DAYS = 7;

// The due date to warn about, or null: only while the school still has access
// (active / grace), the invoice is not yet overdue, and it is due within `days`.
export const paymentDueSoon = (
  { state, paymentDueAt },
  nowMs = Date.now(),
  days = PAYMENT_DUE_WARNING_DAYS,
) => {
  if (state !== 'active' && state !== 'grace') return null;
  const due = toDate(paymentDueAt);
  if (!due) return null;
  const left = due.getTime() - nowMs;
  return left > 0 && left <= days * MS_PER_DAY ? due : null;
};

// States where the whole app should be hard-blocked.
// `unpaid` is read-only like `expired`: the API refuses writes until it is paid.
export const isBlockedState = (state) =>
  state === 'expired' || state === 'unpaid' || state === 'cancelled' || state === 'none';

// A blocked school can still read its unpaid invoice: the API keeps reads and
// billing open and refuses writes (requireActiveSubscription), so the overlay
// steps aside on this one screen. It is a display choice, not an access rule.
export const BILLING_PATH = '/dashboard/billing';

export const isBillingPath = (pathname) => {
  const path = String(pathname || '').replace(/\/+$/, '');
  return path === BILLING_PATH || path.startsWith(`${BILLING_PATH}/`);
};

// Whether the blocking overlay covers this screen. Billing is exempt only for
// a role with 'view-billing': for anyone else the API refuses its reads, so the
// screen would be empty and the school's block unexplained.
export const showsBlockOverlay = ({ state, pathname, canViewBilling }) =>
  isBlockedState(state) && !(canViewBilling && isBillingPath(pathname));
