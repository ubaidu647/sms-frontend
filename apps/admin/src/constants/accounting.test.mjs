// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { isBalanced, journalLinesError, postableLines, sumLines } from './accounting.js';

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

test('a line with an amount but no account is an error naming its on-screen row', () => {
  const lines = [
    { accountId: 'a', debit: '100' },
    { accountId: '', debit: '', credit: '' }, // blank row still counts for numbering
    { accountId: '', credit: '100' },
    { accountId: 'b', credit: '100' },
  ];
  assert.equal(journalLinesError(lines), 'Line 3: pick an account');
  // totals cover only what will be posted, so the orphan line can't make it look balanced
  const totals = sumLines(postableLines(lines));
  assert.deepEqual(totals, { debit: 100, credit: 100 });
});

test('row numbers in errors are the real row, not the filtered index', () => {
  const lines = [
    { accountId: '', debit: '', credit: '' },
    { accountId: 'a', debit: '5', credit: '5' },
  ];
  assert.equal(journalLinesError(lines), "Line 2: a line can't have both a debit and a credit");
});

test('needs two postable lines; an account alone is a blank row', () => {
  assert.equal(
    journalLinesError([{ accountId: 'a', debit: '10' }, { accountId: 'b' }]),
    'Add at least two lines with an account and an amount',
  );
  assert.equal(
    journalLinesError([
      { accountId: 'a', debit: '10' },
      { accountId: 'b', credit: '10' },
    ]),
    null,
  );
  assert.equal(postableLines([{ accountId: 'b' }, { debit: '3' }]).length, 0);
});

test('negative amounts are refused', () => {
  assert.equal(
    journalLinesError([
      { accountId: 'a', debit: '-10' },
      { accountId: 'b', credit: '10' },
    ]),
    "Line 1: amounts can't be negative",
  );
});
