// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { round2, percentOf, formatAmount } from './money.js';

test('round2 rounds to 2 decimals, including the .005 float edge', () => {
  assert.equal(round2(2499.9750000000004), 2499.98);
  assert.equal(round2(1.005), 1.01);
  assert.equal(round2(10), 10);
  assert.equal(round2('12.345'), 12.35);
  assert.equal(round2(undefined), 0);
  assert.equal(round2('abc'), 0);
});

test('percentOf is a rounded share of the base', () => {
  assert.equal(percentOf(33333, 7.5), 2499.98);
  assert.equal(percentOf(50000, 10), 5000);
  assert.equal(percentOf(0, 10), 0);
  assert.equal(percentOf(12345, 33.33), 4114.59);
});

test('formatAmount never shows more than 2 fraction digits', () => {
  // Strip locale grouping separators before comparing.
  assert.equal(formatAmount(1234.5678).replace(/[^\d.]/g, ''), '1234.57');
  assert.equal(formatAmount(10).replace(/[^\d.]/g, ''), '10');
});
