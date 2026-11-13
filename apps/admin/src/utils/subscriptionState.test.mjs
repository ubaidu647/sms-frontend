import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSubscription,
  fromStatusResponse,
  isBillingPath,
  isBlockedState,
  paymentDueSoon,
  showsBlockOverlay,
} from './subscriptionState.js';

const DAY = 24 * 60 * 60 * 1000;
const nowMs = Date.UTC(2026, 0, 15);
const iso = (offsetDays) => new Date(nowMs + offsetDays * DAY).toISOString();

test('isBillingPath matches the Billing screen and nothing that only starts like it', () => {
  assert.equal(isBillingPath('/dashboard/billing'), true);
  assert.equal(isBillingPath('/dashboard/billing/'), true);
  assert.equal(isBillingPath('/dashboard/billing/invoices'), true);
  assert.equal(isBillingPath('/dashboard/billing-export'), false);
  assert.equal(isBillingPath('/dashboard/school/billing'), false);
  assert.equal(isBillingPath('/dashboard'), false);
  assert.equal(isBillingPath(null), false);
});

test('a blocked school is covered everywhere but Billing', () => {
  for (const state of ['expired', 'unpaid', 'cancelled', 'none']) {
    const blocked = { state, canViewBilling: true };
    assert.equal(showsBlockOverlay({ ...blocked, pathname: '/dashboard/school/fees' }), true);
    assert.equal(showsBlockOverlay({ ...blocked, pathname: '/dashboard/billing' }), false);
  }
});

test('Billing stays covered for a role that cannot read it', () => {
  const pathname = '/dashboard/billing';
  assert.equal(showsBlockOverlay({ state: 'expired', pathname, canViewBilling: false }), true);
});

test('no overlay while active, in grace or with the state unknown', () => {
  for (const state of ['active', 'grace', null]) {
    const pathname = '/dashboard/school/fees';
    assert.equal(showsBlockOverlay({ state, pathname, canViewBilling: true }), false);
  }
});

test('unpaid is a known, read-only state', () => {
  const v = fromStatusResponse(
    { state: 'unpaid', endDate: iso(10), hardBlockAt: iso(10), paymentDueAt: iso(-1) },
    nowMs,
  );
  assert.equal(v.state, 'unpaid');
  assert.equal(v.paymentDueAt.toISOString(), iso(-1));
  assert.equal(isBlockedState('unpaid'), true);
});

test('an active plan crosses into unpaid once its payment due date passes', () => {
  const status = { state: 'active', endDate: iso(20), hardBlockAt: iso(20), paymentDueAt: iso(1) };
  assert.equal(fromStatusResponse(status, nowMs).state, 'active');
  assert.equal(fromStatusResponse(status, nowMs + 2 * DAY).state, 'unpaid');
});

test('a plan in grace with an overdue invoice is unpaid', () => {
  const status = { state: 'grace', endDate: iso(-2), hardBlockAt: iso(3), paymentDueAt: iso(-1) };
  assert.equal(fromStatusResponse(status, nowMs).state, 'unpaid');
});

test('past grace is expired even with an overdue invoice', () => {
  const status = {
    state: 'unpaid',
    endDate: iso(-5),
    hardBlockAt: iso(-1),
    paymentDueAt: iso(-10),
  };
  assert.equal(fromStatusResponse(status, nowMs).state, 'expired');
});

test('no paymentDueAt means nothing is owed', () => {
  const v = fromStatusResponse({ state: 'active', endDate: iso(20), hardBlockAt: iso(20) }, nowMs);
  assert.equal(v.state, 'active');
  assert.equal(v.paymentDueAt, null);
});

test('an unknown state is fail-open', () => {
  assert.equal(fromStatusResponse({ state: 'weird' }, nowMs).state, null);
  assert.equal(fromStatusResponse(null, nowMs).state, null);
});

test('evaluateSubscription marks an overdue invoice unpaid', () => {
  const sub = { status: 'active', endDate: iso(20), gracePeriodInDays: 0 };
  assert.equal(evaluateSubscription({ ...sub, paymentDueAt: iso(-1) }, nowMs).state, 'unpaid');
  assert.equal(evaluateSubscription({ ...sub, paymentDueAt: iso(1) }, nowMs).state, 'active');
  assert.equal(evaluateSubscription(sub, nowMs).state, 'active');
  const ended = { status: 'active', endDate: iso(-3), gracePeriodInDays: 1, paymentDueAt: iso(-5) };
  assert.equal(evaluateSubscription(ended, nowMs).state, 'expired');
});

test('paymentDueSoon warns only within 7 days of a future due date', () => {
  const at = (days, state = 'active') => paymentDueSoon({ state, paymentDueAt: iso(days) }, nowMs);
  assert.equal(at(3).toISOString(), iso(3));
  assert.equal(at(7).toISOString(), iso(7));
  assert.equal(at(8), null);
  assert.equal(at(-1), null);
  assert.equal(at(3, 'grace').toISOString(), iso(3));
  assert.equal(at(3, 'unpaid'), null);
  assert.equal(at(3, 'expired'), null);
  assert.equal(paymentDueSoon({ state: 'active', paymentDueAt: null }, nowMs), null);
});
