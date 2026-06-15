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
//   cancelled— explicitly cancelled; hard-blocked
//   none     — no live subscription on record; hard-blocked

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  if (nowMs > endMs) return { state: 'grace', hardBlockAt, endDate };
  return { state: 'active', hardBlockAt, endDate };
};

// States where the whole app should be hard-blocked.
export const isBlockedState = (state) =>
  state === 'expired' || state === 'cancelled' || state === 'none';
