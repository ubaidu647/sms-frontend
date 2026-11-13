// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PLATFORM_CURRENCY_SYMBOL, fmtPlatformMoney } from './platformMoney.js';

const digits = (s) => s.replace(/[^\d.\-A-Za-z ]/g, '');

test('platform currency is Rs', () => {
  assert.equal(PLATFORM_CURRENCY_SYMBOL, 'Rs');
});

test('fmtPlatformMoney prefixes the platform symbol', () => {
  assert.equal(fmtPlatformMoney(10), 'Rs 10');
  assert.equal(fmtPlatformMoney('10'), 'Rs 10');
  assert.equal(fmtPlatformMoney(0), 'Rs 0');
  assert.equal(digits(fmtPlatformMoney(1250.567)), 'Rs 1250.57');
});

test('fmtPlatformMoney shows "-" for a non-numeric value', () => {
  for (const v of [undefined, 'abc', NaN, Infinity]) {
    assert.equal(fmtPlatformMoney(v), '-');
  }
});
