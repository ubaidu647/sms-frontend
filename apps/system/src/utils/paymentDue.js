// Payment-due ("block when unpaid") helpers for the subscription screens.
// Backend contract: `paymentDueInDays` is a whole number 1–365, or null = never
// block. Omitted on a request, the previous plan's value carries over (else the
// server default, 15). Once `paymentDueAt` passes with the invoice unpaid, the
// school turns read-only until the invoice is marked paid.

export const PAYMENT_DUE_MIN = 1;
export const PAYMENT_DUE_MAX = 365;

/**
 * Reads the "Block when unpaid" checkbox + days input into the request value.
 *
 * @param {object} args
 * @param {boolean} args.block  the checkbox
 * @param {string|number} args.days  the input ('' = keep the existing value)
 * @param {number|null|undefined} args.previous  the current plan's value, when
 *   known. null (blocking off) makes a blank input an error when turning it on,
 *   since omitting the key would carry the "off" over.
 * @returns {{ error: string, value: number|null|undefined }} `value` undefined
 *   means "omit the key".
 */
export const readPaymentDue = ({ block, days, previous }) => {
  if (!block) return { error: '', value: null };
  if (days === '' || days == null) {
    if (previous === null) {
      return {
        error: 'Enter the number of days to turn on blocking when unpaid.',
        value: undefined,
      };
    }
    return { error: '', value: undefined };
  }
  const n = Number(days);
  if (!Number.isInteger(n) || n < PAYMENT_DUE_MIN || n > PAYMENT_DUE_MAX) {
    return {
      error: `Payment due must be a whole number of days from ${PAYMENT_DUE_MIN} to ${PAYMENT_DUE_MAX}.`,
      value: undefined,
    };
  }
  return { error: '', value: n };
};

// Adds `paymentDueInDays` to `payload` unless the value means "omit".
export const withPaymentDue = (payload, value) =>
  value === undefined ? payload : { ...payload, paymentDueInDays: value };

// Form state for a plan's current value: blocking on unless it is explicitly
// off (null); the days pre-filled when known so the admin sees and can keep them.
export const paymentDueFormState = (current) => {
  const v = current?.paymentDueInDays;
  return {
    block: v !== null,
    days: typeof v === 'number' ? String(v) : '',
  };
};

// "15 days" / "1 day" / "Off" / "Default" (never set on a legacy plan).
export const paymentWindowLabel = (days) => {
  if (days === null) return 'Off';
  if (typeof days !== 'number') return 'Default';
  return `${days} ${days === 1 ? 'day' : 'days'}`;
};

const LIVE_STATUSES = ['active', 'trial'];

// Whether this subscription's invoice is past due on a live plan, i.e. the
// school is currently blocked for non-payment.
export const isPaymentOverdue = (sub, nowMs = Date.now()) => {
  if (!sub?.paymentDueAt || !LIVE_STATUSES.includes(sub.status)) return false;
  const due = new Date(sub.paymentDueAt).getTime();
  return Number.isFinite(due) && due < nowMs;
};
