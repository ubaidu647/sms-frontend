// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isBalanced, sumLines } from './accounting.js';

test('decimal lines that agree to the paisa balance despite float noise', () => {
  const totals = sumLines([
    { debit: '0.1', credit: '' },
    { debit: '0.2', credit: '' },
    { debit: '', credit: '0.3' },
  ]);
  assert.notEqual(totals.debit, totals.credit); // 0.30000000000000004 vs 0.3
  assert.equal(isBalanced(totals), true);
});

test('a one-paisa difference is unbalanced', () => {
  assert.equal(isBalanced(sumLines([{ debit: '100.01' }, { credit: '100' }])), false);
});

test('an empty entry is not balanced', () => {
  assert.equal(isBalanced(sumLines([{ debit: '', credit: '' }])), false);
});
