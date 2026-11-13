// Preview of what POST /subscription/change (and /renew) will bill, mirroring
// the backend's createSubscriptionWithInvoice (sms-backend/src/modules/
// subscription/subscription.helper.ts). The server stays authoritative.

import { enabledPlanFeatures } from './planFeatures.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const round2 = (n) => Math.round(n * 100) / 100;

// `amount` prorated by the days left on the current plan.
const unusedShare = (current, amount, nowMs) => {
  let total = current.packageSnapshot.durationInDays ?? 0;
  if (total <= 0 && current.startDate) {
    total = (new Date(current.endDate) - new Date(current.startDate)) / MS_PER_DAY;
  }
  if (amount <= 0 || total <= 0) return 0;
  const remainingDays = Math.max(0, (new Date(current.endDate).getTime() - nowMs) / MS_PER_DAY);
  return round2(amount * (remainingDays / total));
};

const idOf = (v) => String(v?._id ?? v ?? '');

// A module add-on is one unit, whatever its stored quantity says.
const unitsOf = (a) => (a?.resource === 'module' ? 1 : Number(a?.quantity) || 0);

/**
 * The add-ons a renewal carries, as the backend's mergeAddons does: a module
 * the renewed plan includes itself (or a plan that opens every module) is
 * dropped, and a module listed twice at one price counts once.
 * `planFeatures` undefined → the plan's modules are unknown: keep them all.
 */
export const carriedAddons = (addons, planFeatures) => {
  const open = planFeatures === undefined ? undefined : enabledPlanFeatures(planFeatures);
  const seen = new Set();
  const out = [];
  for (const a of addons ?? []) {
    if (a?.resource === 'module') {
      if (open === null || (open && open.includes(a.module))) continue;
      const key = `${a.module}:${a.unitPrice}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(a);
  }
  return out;
};

/**
 * What the add-ons do to the bill. Mirrors the add-on part of the backend's
 * createSubscriptionWithInvoice: paid add-ons are worth their prorated value
 * (credited, unless an 'endDate' renewal keeps them as days); unpaid add-on
 * invoices are voided; kept add-ons are billed for the full new period at
 * their unit price, rescaled when the period length changes.
 */
const addonEffect = ({
  current,
  addons,
  keepAddons,
  addonInvoices,
  nowMs,
  extendFromEnd,
  durationInDays,
  planFeatures,
}) => {
  const list = addons ?? [];
  const oldDays = current.packageSnapshot.durationInDays ?? 0;
  const newDays = durationInDays ?? oldDays;
  let charge = 0;
  if (keepAddons) {
    for (const a of carriedAddons(list, planFeatures)) {
      const unit =
        oldDays > 0 && newDays > 0 && oldDays !== newDays
          ? round2((a.unitPrice * newDays) / oldDays)
          : a.unitPrice;
      charge = round2(charge + round2(unitsOf(a) * unit));
    }
  }
  // Statuses unknown: no credit, as for the plan's own invoice.
  const known = addonInvoices !== undefined;
  let valueLeft = 0;
  let unpaidAddonInvoice = false;
  for (const a of list) {
    const inv = known && a.invoiceId ? addonInvoices[idOf(a.invoiceId)] : undefined;
    if (inv?.status === 'unpaid') {
      if (inv.type === 'addon') unpaidAddonInvoice = true;
      continue;
    }
    if (inv?.status === 'void' || !known) continue;
    valueLeft = round2(valueLeft + unusedShare(current, unitsOf(a) * a.unitPrice, nowMs));
  }
  const credit = extendFromEnd && keepAddons ? 0 : valueLeft;
  return { charge, credit, unpaidAddonInvoice };
};

/**
 * @param {object} args
 * @param {object} args.current  the school's live subscription
 * @param {object|null|undefined} args.invoice  the current subscription's latest
 *   invoice: null when it has none (legacy, billed as paid), undefined when its
 *   status isn't known yet. Unknown leaves the unused-time credit out, so the
 *   estimate never shows credit the server may refuse.
 * @param {'today'|'endDate'} [args.startFrom]  renewals only. 'endDate' starts
 *   the new period when the current one ends: the remaining days are kept as
 *   days, so nothing is credited for them (carried credit still applies). A
 *   plan already past its end date renews from today either way.
 * @param {number} [args.durationInDays]  length of the new period; when given,
 *   `newEndDate` is returned.
 * @param {number} args.newPrice price of the chosen package — for a launch
 *   offer or a running price lock, the price the school will actually pay
 *   (see utils/launchOffer.js startPrice / renewalPrice).
 * @param {Array} [args.addons]  the current subscription's add-ons
 *   ({ resource, module?, quantity, unitPrice, invoiceId }); a module add-on
 *   counts as 1 × unitPrice.
 * @param {boolean} [args.keepAddons]  renewals only: carry the add-ons over,
 *   billed for the whole new period. A plan change always drops them.
 * @param {Array} [args.planFeatures]  renewals only: the renewed plan's
 *   `features`; a module add-on it now includes is not carried (billed).
 * @param {object} [args.addonInvoices]  invoices by id, for the add-ons'
 *   payment status; undefined while unknown (their credit is left out).
 * @returns null when the current plan's price or end date is missing.
 *   `periodFrom` is when the billed period starts (the payment-due clock runs
 *   from it); `unpaidBlocksExtend` is true when an 'endDate' renewal will be
 *   refused because the current invoice (or an add-on invoice) is unpaid.
 *   `addonCharge` is what kept add-ons add to the bill; `addonCredit` the
 *   unused value of paid add-ons credited against it.
 */
export function planChangeEstimate({
  current,
  newPrice,
  invoice,
  nowMs = Date.now(),
  startFrom = 'today',
  durationInDays,
  addons,
  keepAddons = false,
  addonInvoices,
  planFeatures,
}) {
  const price = current?.packageSnapshot?.price;
  if (price == null || newPrice == null || !current?.endDate) return null;

  const endMs = new Date(current.endDate).getTime();
  const extendFromEnd = startFrom === 'endDate' && endMs > nowMs;

  const unknown = invoice === undefined;
  const paid = !unknown && (invoice === null || invoice.status === 'paid');
  const unusedCredit = paid && !extendFromEnd ? unusedShare(current, price, nowMs) : 0;
  // An unpaid invoice is voided by the change; of the credit it had consumed,
  // only the part covering days still ahead comes back. (An extension is
  // refused outright while the invoice is unpaid, so it restores nothing.)
  const creditApplied =
    invoice?.status === 'unpaid' && !extendFromEnd ? invoice.creditApplied || 0 : 0;
  const restoredCredit = round2(
    Math.min(creditApplied, unusedShare(current, creditApplied, nowMs)),
  );
  const carriedCredit = current.carriedCredit || 0;
  const addon = addonEffect({
    current,
    addons,
    keepAddons,
    addonInvoices,
    nowMs,
    extendFromEnd,
    durationInDays,
    planFeatures,
  });

  const credit = round2(unusedCredit + restoredCredit + carriedCredit + addon.credit);
  const gross = round2(newPrice + addon.charge);
  const applied = Math.min(credit, gross);
  const periodFrom = new Date(extendFromEnd ? endMs : nowMs);
  return {
    direction: newPrice >= price ? 'Upgrade' : 'Downgrade',
    invoiceStatus: unknown ? 'unknown' : (invoice?.status ?? 'none'),
    extendFromEnd,
    unpaidBlocksExtend: extendFromEnd && (invoice?.status === 'unpaid' || addon.unpaidAddonInvoice),
    unusedCredit,
    restoredCredit,
    carriedCredit,
    addonCharge: addon.charge,
    addonCredit: addon.credit,
    amountDue: round2(gross - applied),
    creditCarriedForward: round2(credit - applied),
    periodFrom,
    newEndDate:
      durationInDays != null
        ? new Date(periodFrom.getTime() + durationInDays * MS_PER_DAY)
        : undefined,
  };
}
