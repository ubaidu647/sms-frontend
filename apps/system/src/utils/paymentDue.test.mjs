import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPaymentOverdue,
  paymentDueFormState,
  paymentWindowLabel,
  readPaymentDue,
  withPaymentDue,
} from './paymentDue.js';

test('blocking off sends null', () => {
  assert.deepEqual(readPaymentDue({ block: false, days: '20' }), { error: '', value: null });
});

test('a blank field keeps the existing value (key omitted)', () => {
  assert.deepEqual(readPaymentDue({ block: true, days: '' }), { error: '', value: undefined });
  assert.deepEqual(readPaymentDue({ block: true, days: '', previous: 10 }), {
    error: '',
    value: undefined,
  });
});

test('turning blocking back on needs a number', () => {
  assert.ok(readPaymentDue({ block: true, days: '', previous: null }).error);
});

test('days must be a whole number from 1 to 365', () => {
  assert.equal(readPaymentDue({ block: true, days: '1' }).value, 1);
  assert.equal(readPaymentDue({ block: true, days: '365' }).value, 365);
  for (const days of ['0', '366', '2.5', '-3', 'abc']) {
    const r = readPaymentDue({ block: true, days });
    assert.ok(r.error, days);
    assert.equal(r.value, undefined);
  }
});

test('withPaymentDue omits only undefined', () => {
  assert.deepEqual(withPaymentDue({ a: 1 }, undefined), { a: 1 });
  assert.deepEqual(withPaymentDue({ a: 1 }, null), { a: 1, paymentDueInDays: null });
  assert.deepEqual(withPaymentDue({ a: 1 }, 15), { a: 1, paymentDueInDays: 15 });
});

test('form state mirrors the current plan', () => {
  assert.deepEqual(paymentDueFormState({ paymentDueInDays: 10 }), { block: true, days: '10' });
  assert.deepEqual(paymentDueFormState({ paymentDueInDays: null }), { block: false, days: '' });
  assert.deepEqual(paymentDueFormState({}), { block: true, days: '' });
  assert.deepEqual(paymentDueFormState(null), { block: true, days: '' });
});

test('payment window label', () => {
  assert.equal(paymentWindowLabel(15), '15 days');
  assert.equal(paymentWindowLabel(1), '1 day');
  assert.equal(paymentWindowLabel(null), 'Off');
  assert.equal(paymentWindowLabel(undefined), 'Default');
});

test('overdue only on a live plan past its due date', () => {
  const now = Date.UTC(2026, 0, 15);
  const past = new Date(now - 1000).toISOString();
  const future = new Date(now + 1000).toISOString();
  assert.equal(isPaymentOverdue({ status: 'active', paymentDueAt: past }, now), true);
  assert.equal(isPaymentOverdue({ status: 'trial', paymentDueAt: past }, now), true);
  assert.equal(isPaymentOverdue({ status: 'active', paymentDueAt: future }, now), false);
  assert.equal(isPaymentOverdue({ status: 'expired', paymentDueAt: past }, now), false);
  assert.equal(isPaymentOverdue({ status: 'active' }, now), false);
  assert.equal(isPaymentOverdue(null, now), false);
});
