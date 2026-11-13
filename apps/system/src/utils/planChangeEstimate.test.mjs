import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planChangeEstimate } from './planChangeEstimate.js';

const DAY = 24 * 60 * 60 * 1000;
const nowMs = Date.UTC(2026, 0, 1);

// Half of a 30-day, 3000 plan left: 1500 of unused value.
const current = (extra = {}) => ({
  packageSnapshot: { price: 3000, durationInDays: 30 },
  endDate: new Date(nowMs + 15 * DAY).toISOString(),
  ...extra,
});
const estimate = (args) => planChangeEstimate({ nowMs, newPrice: 5000, ...args });

test('a paid invoice credits the unused time', () => {
  const e = estimate({ current: current(), invoice: { status: 'paid' } });
  assert.equal(e.unusedCredit, 1500);
  assert.equal(e.amountDue, 3500);
  assert.equal(e.direction, 'Upgrade');
});

test('no invoice on record is billed like a paid one', () => {
  const e = estimate({ current: current(), invoice: null });
  assert.equal(e.unusedCredit, 1500);
  assert.equal(e.invoiceStatus, 'none');
});

test('an unpaid invoice gives no unused-time credit', () => {
  const e = estimate({ current: current(), invoice: { status: 'unpaid' } });
  assert.equal(e.unusedCredit, 0);
  assert.equal(e.amountDue, 5000);
});

test('an unpaid invoice restores only the unused share of its credit', () => {
  const e = estimate({ current: current(), invoice: { status: 'unpaid', creditApplied: 800 } });
  assert.equal(e.restoredCredit, 400);
  assert.equal(e.amountDue, 4600);
});

test('a void invoice gives no credit', () => {
  const e = estimate({ current: current(), invoice: { status: 'void', creditApplied: 800 } });
  assert.equal(e.unusedCredit, 0);
  assert.equal(e.restoredCredit, 0);
  assert.equal(e.amountDue, 5000);
});

test('carried credit counts whatever the invoice status', () => {
  const sub = current({ carriedCredit: 250 });
  assert.equal(estimate({ current: sub, invoice: { status: 'paid' } }).amountDue, 3250);
  assert.equal(estimate({ current: sub, invoice: { status: 'unpaid' } }).amountDue, 4750);
});

test('an unknown invoice status leaves the unused-time credit out', () => {
  const e = estimate({ current: current({ carriedCredit: 250 }) });
  assert.equal(e.invoiceStatus, 'unknown');
  assert.equal(e.unusedCredit, 0);
  assert.equal(e.amountDue, 4750);
});

test('credit beyond the new price is carried forward', () => {
  const e = planChangeEstimate({
    nowMs,
    newPrice: 1000,
    current: current({ carriedCredit: 250 }),
    invoice: { status: 'paid' },
  });
  assert.equal(e.direction, 'Downgrade');
  assert.equal(e.amountDue, 0);
  assert.equal(e.creditCarriedForward, 750);
});

test('an ended plan has no unused time to credit', () => {
  const ended = current({ endDate: new Date(nowMs - DAY).toISOString() });
  assert.equal(estimate({ current: ended, invoice: { status: 'paid' } }).unusedCredit, 0);
});

test('a zero duration falls back to the plan dates', () => {
  const sub = current({
    packageSnapshot: { price: 3000, durationInDays: 0 },
    startDate: new Date(nowMs - 15 * DAY).toISOString(),
  });
  assert.equal(estimate({ current: sub, invoice: null }).unusedCredit, 1500);
});

test('no estimate without a price or an end date', () => {
  assert.equal(estimate({ current: { endDate: '2026-02-01' }, invoice: null }), null);
  assert.equal(estimate({ current: { packageSnapshot: { price: 1 } }, invoice: null }), null);
  assert.equal(estimate({ current: null, invoice: null }), null);
});

/* ------------------------- renew: startFrom ------------------------- */

const renew = (args) => planChangeEstimate({ nowMs, newPrice: 3000, durationInDays: 30, ...args });

test('renew from today credits the remaining days and starts now', () => {
  const e = renew({ current: current(), invoice: { status: 'paid' }, startFrom: 'today' });
  assert.equal(e.extendFromEnd, false);
  assert.equal(e.unusedCredit, 1500);
  assert.equal(e.amountDue, 1500);
  assert.equal(e.periodFrom.getTime(), nowMs);
  assert.equal(e.newEndDate.getTime(), nowMs + 30 * DAY);
});

test('renew from the end date keeps the days, gives no credit, starts at the old end', () => {
  const sub = current();
  const e = renew({ current: sub, invoice: { status: 'paid' }, startFrom: 'endDate' });
  assert.equal(e.extendFromEnd, true);
  assert.equal(e.unusedCredit, 0);
  assert.equal(e.amountDue, 3000);
  assert.equal(e.periodFrom.toISOString(), sub.endDate);
  assert.equal(e.newEndDate.getTime(), nowMs + 45 * DAY);
});

test('renew from the end date still applies carried credit', () => {
  const e = renew({
    current: current({ carriedCredit: 250 }),
    invoice: { status: 'paid' },
    startFrom: 'endDate',
  });
  assert.equal(e.amountDue, 2750);
});

test('renew from the end date with an unpaid invoice is flagged and restores nothing', () => {
  const e = renew({
    current: current(),
    invoice: { status: 'unpaid', creditApplied: 800 },
    startFrom: 'endDate',
  });
  assert.equal(e.unpaidBlocksExtend, true);
  assert.equal(e.restoredCredit, 0);
});

test('a plan past its end date renews from today either way', () => {
  const ended = current({ endDate: new Date(nowMs - DAY).toISOString() });
  const a = renew({ current: ended, invoice: { status: 'unpaid' }, startFrom: 'endDate' });
  const b = renew({ current: ended, invoice: { status: 'unpaid' }, startFrom: 'today' });
  assert.equal(a.extendFromEnd, false);
  assert.equal(a.unpaidBlocksExtend, false);
  assert.equal(a.newEndDate.getTime(), b.newEndDate.getTime());
  assert.equal(a.amountDue, b.amountDue);
});

test('no new end date without a duration', () => {
  assert.equal(estimate({ current: current(), invoice: null }).newEndDate, undefined);
});

/* ------------------------------ add-ons ------------------------------ */

// +100 students @ 10 per 30 days: 1000 a period, 500 of it still ahead.
const addons = [{ resource: 'noOfStudents', quantity: 100, unitPrice: 10, invoiceId: 'a1' }];
const paidAddon = { a1: { _id: 'a1', type: 'addon', status: 'paid' } };
const unpaidAddon = { a1: { _id: 'a1', type: 'addon', status: 'unpaid' } };

test('kept add-ons are billed for the new period and their paid value is credited', () => {
  const e = renew({
    current: current(),
    invoice: { status: 'paid' },
    addons,
    keepAddons: true,
    addonInvoices: paidAddon,
  });
  assert.equal(e.addonCharge, 1000);
  assert.equal(e.addonCredit, 500);
  // 3000 + 1000 − 1500 plan credit − 500 add-on credit
  assert.equal(e.amountDue, 2000);
});

test('dropped add-ons are not billed, but their paid unused value is credited', () => {
  const e = renew({
    current: current(),
    invoice: { status: 'paid' },
    addons,
    keepAddons: false,
    addonInvoices: paidAddon,
  });
  assert.equal(e.addonCharge, 0);
  assert.equal(e.addonCredit, 500);
  assert.equal(e.amountDue, 1000);
});

test('an unpaid add-on earns no credit and blocks a renewal from the end date', () => {
  const today = renew({
    current: current(),
    invoice: { status: 'paid' },
    addons,
    addonInvoices: unpaidAddon,
  });
  assert.equal(today.addonCredit, 0);
  const fromEnd = renew({
    current: current(),
    invoice: { status: 'paid' },
    addons,
    keepAddons: true,
    addonInvoices: unpaidAddon,
    startFrom: 'endDate',
  });
  assert.equal(fromEnd.unpaidBlocksExtend, true);
});

test('renewing from the end date and keeping add-ons keeps their days, no credit', () => {
  const e = renew({
    current: current(),
    invoice: { status: 'paid' },
    addons,
    keepAddons: true,
    addonInvoices: paidAddon,
    startFrom: 'endDate',
  });
  assert.equal(e.addonCredit, 0);
  assert.equal(e.amountDue, 4000);
});

test('unknown add-on invoice statuses leave their credit out', () => {
  const e = renew({ current: current(), invoice: { status: 'paid' }, addons, keepAddons: true });
  assert.equal(e.addonCredit, 0);
  assert.equal(e.addonCharge, 1000);
});

test('a longer new period rescales the kept unit price', () => {
  const e = planChangeEstimate({
    nowMs,
    newPrice: 3000,
    durationInDays: 60,
    current: current(),
    invoice: { status: 'paid' },
    addons,
    keepAddons: true,
    addonInvoices: paidAddon,
  });
  assert.equal(e.addonCharge, 2000);
});

test('a plan change drops add-ons but credits their paid value', () => {
  const e = estimate({
    current: current(),
    invoice: { status: 'paid' },
    addons,
    addonInvoices: paidAddon,
  });
  assert.equal(e.addonCharge, 0);
  assert.equal(e.addonCredit, 500);
  assert.equal(e.amountDue, 3000);
});

/* ---------------------------- module add-ons ---------------------------- */

const moduleAddon = {
  resource: 'module',
  module: 'whatsapp',
  quantity: 1,
  unitPrice: 1000,
  invoiceId: 'a1',
};

test('a kept module add-on bills 1 × unit price', () => {
  const e = planChangeEstimate({
    nowMs,
    newPrice: 3000,
    current: current(),
    invoice: { status: 'unpaid' },
    addons: [moduleAddon],
    keepAddons: true,
    addonInvoices: { a1: { status: 'unpaid', type: 'addon' } },
    planFeatures: ['core', 'library'],
  });
  assert.equal(e.addonCharge, 1000);
  assert.equal(e.amountDue, 4000);
});

test('a renewal does not carry a module the plan now includes', () => {
  const args = {
    nowMs,
    newPrice: 3000,
    current: current(),
    invoice: { status: 'unpaid' },
    addons: [moduleAddon],
    keepAddons: true,
    addonInvoices: {},
  };
  assert.equal(planChangeEstimate({ ...args, planFeatures: ['core', 'whatsapp'] }).addonCharge, 0);
  // A plan that opens every module carries none.
  assert.equal(planChangeEstimate({ ...args, planFeatures: [] }).addonCharge, 0);
});

test('a dropped paid module add-on credits its unused value', () => {
  const e = planChangeEstimate({
    nowMs,
    newPrice: 5000,
    current: current(),
    invoice: { status: 'paid' },
    addons: [{ ...moduleAddon, quantity: 7 }],
    addonInvoices: { a1: { status: 'paid', type: 'addon' } },
  });
  // Half the period left of 1 × 1000.
  assert.equal(e.addonCredit, 500);
  assert.equal(e.amountDue, 3000);
});

import { carriedAddons } from './planChangeEstimate.js';

test('carriedAddons merges a duplicate module and keeps limits', () => {
  const list = [
    moduleAddon,
    { ...moduleAddon, _id: 'b' },
    { resource: 'noOfStudents', quantity: 10, unitPrice: 5 },
  ];
  assert.equal(carriedAddons(list, ['core']).length, 2);
  assert.equal(carriedAddons(list, undefined).length, 2);
});
