// Launch offers: the first `maxSchools` schools that start on a package pay
// `price`, and keep it on renewals until `subscription.priceLock.until`.
// Mirrors sms-backend (package launchOffer, subscription.helper resolvePriceLock);
// the server stays authoritative — it also reuses a lock a school took on the
// same package before, which the client cannot see.

const num = (v) => (v === '' || v == null ? NaN : Number(v));

/** Slots still free on an offer (0 when none / full). */
export const offerSlotsLeft = (offer) => {
  if (!offer) return 0;
  const max = Number(offer.maxSchools) || 0;
  const claimed = Number(offer.claimed) || 0;
  return Math.max(0, max - claimed);
};

/** True when a school starting on `pkg` now would get its launch offer. */
export const offerAvailable = (pkg) => {
  const offer = pkg?.launchOffer;
  return (
    !!offer &&
    offer.active !== false &&
    Number.isFinite(Number(offer.price)) &&
    offerSlotsLeft(offer) > 0
  );
};

/**
 * The price a school starting on `pkg` will be billed: the offer price when
 * the offer applies (and `apply` is on), else the package price.
 */
export const startPrice = (pkg, apply = true) =>
  pkg == null ? null : apply && offerAvailable(pkg) ? Number(pkg.launchOffer.price) : pkg.price;

/**
 * "Offer: Rs 3,500 · 3/30 left" (`fmt` formats money); null when the package
 * has no offer. A paused or full offer says so.
 */
export const offerChip = (pkg, fmt) => {
  const offer = pkg?.launchOffer;
  if (!offer) return null;
  const left = offerSlotsLeft(offer);
  const max = Number(offer.maxSchools) || 0;
  const state = offer.active === false ? ' · paused' : left === 0 ? ' · full' : '';
  return `Offer: ${fmt(offer.price)} · ${left}/${max} left${state}`;
};

/* ------------------------------ Price lock ------------------------------ */

/** The subscription's price lock while it is still running, else null. */
export const livePriceLock = (sub, nowMs = Date.now()) => {
  const lock = sub?.priceLock;
  if (!lock || lock.price == null || !lock.until) return null;
  const until = new Date(lock.until).getTime();
  return Number.isFinite(until) && until > nowMs ? { price: Number(lock.price), until } : null;
};

/**
 * What a renewal of the same package bills: the locked launch price while the
 * lock runs, else the catalogue price (the snapshot's when it is unlisted).
 */
export const renewalPrice = ({ current, catalogPrice, nowMs = Date.now() }) => {
  const lock = livePriceLock(current, nowMs);
  if (lock) return lock.price;
  return catalogPrice ?? current?.packageSnapshot?.price ?? null;
};

/* ------------------------------ Package form ------------------------------ */

/** Package → form values for the launch-offer section. */
export const launchOfferToForm = (pkg) => {
  const o = pkg?.launchOffer;
  return {
    offerOn: !!o,
    offerActive: o ? o.active !== false : true,
    offerPrice: o?.price != null ? String(o.price) : '',
    offerMaxSchools: o?.maxSchools != null ? String(o.maxSchools) : '',
    offerLockDays: o?.lockDays != null ? String(o.lockDays) : '',
  };
};

/**
 * Form values → `launchOffer` payload: null when the section is off (removes
 * the offer); `claimed` is never sent. → { value } | { error, field }
 */
export const launchOfferFromForm = (values) => {
  if (!values?.offerOn) return { value: null };
  const price = num(values.offerPrice);
  if (!Number.isFinite(price) || price < 0) {
    return { error: 'Offer price must be 0 or more.', field: 'offerPrice' };
  }
  const maxSchools = num(values.offerMaxSchools);
  if (!Number.isInteger(maxSchools) || maxSchools < 1) {
    return { error: 'Max schools must be a whole number of at least 1.', field: 'offerMaxSchools' };
  }
  const lockDays = num(values.offerLockDays);
  if (!Number.isInteger(lockDays) || lockDays < 1 || lockDays > 3650) {
    return {
      error: 'Lock days must be a whole number from 1 to 3650.',
      field: 'offerLockDays',
    };
  }
  return { value: { active: values.offerActive !== false, price, maxSchools, lockDays } };
};

/**
 * The `launchOffer` field for signup / assign / change: `false` only when the
 * offer would apply and the super-admin unticked it; otherwise left out (the
 * server's default is to offer it).
 */
export const launchOfferPayload = (pkg, apply) =>
  offerAvailable(pkg) && !apply ? { launchOffer: false } : {};
