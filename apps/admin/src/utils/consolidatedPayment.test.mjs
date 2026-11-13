// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { consolidatedReach } from './consolidatedPayment.js';

const v = (voucherNumber, balanceAmount, branchId) => ({ voucherNumber, balanceAmount, branchId });
const own = (x) => x.branchId === 'own';

test('consolidatedReach: every voucher in the branch is fully payable', () => {
  assert.deepEqual(consolidatedReach([v('A', 100.1, 'own'), v('B', 200.2, 'own')], own), {
    payable: 300.3,
    blocker: null,
  });
});

test('consolidatedReach: a foreign oldest voucher blocks everything', () => {
  const foreign = v('A', 100, 'other');
  assert.deepEqual(consolidatedReach([foreign, v('B', 200, 'own')], own), {
    payable: 0,
    blocker: foreign,
  });
});

test('consolidatedReach: a foreign later voucher caps the payable amount', () => {
  const foreign = v('B', 200, 'other');
  assert.deepEqual(consolidatedReach([v('A', 100, 'own'), foreign, v('C', 50, 'own')], own), {
    payable: 100,
    blocker: foreign,
  });
});

test('consolidatedReach: a settled voucher takes no slice, so it blocks nothing', () => {
  assert.deepEqual(consolidatedReach([v('A', 0, 'other'), v('B', 100, 'own')], own), {
    payable: 100,
    blocker: null,
  });
});

test('consolidatedReach: empty or missing list', () => {
  assert.deepEqual(consolidatedReach([], own), { payable: 0, blocker: null });
  assert.deepEqual(consolidatedReach(undefined, own), { payable: 0, blocker: null });
});
