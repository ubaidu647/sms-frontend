// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_COPIES_PER_REQUEST,
  normalizeCode,
  ymdOf,
  diffDaysYMD,
  overdueDays,
  isLoanOverdue,
  loanDisplayStatus,
  previewFine,
  defaultDueDate,
  validateDueDate,
  limitsFor,
  splitList,
  buildBookPayload,
  buildLoanListParams,
  loanRowActions,
  pendingFineTotal,
  loanBorrowerName,
  loanBorrowerId,
  loanAccession,
  buildSettingsPayload,
  settingsToForm,
} from './library.js';

test('normalizeCode trims, strips control chars and uppercases scanner input', () => {
  assert.equal(normalizeCode('  acc-000012\r\n'), 'ACC-000012');
  assert.equal(normalizeCode('\tbc123x\t'), 'BC123X');
  assert.equal(normalizeCode(null), '');
  assert.equal(normalizeCode(9780131), '9780131');
});

test('ymdOf handles date-only strings, ISO timestamps and Dates', () => {
  assert.equal(ymdOf('2026-10-13'), '2026-10-13');
  assert.equal(ymdOf('2026-10-13T00:00:00.000Z'), '2026-10-13');
  assert.equal(ymdOf(new Date(Date.UTC(2026, 0, 5))), '2026-01-05');
  assert.equal(ymdOf(''), '');
  assert.equal(ymdOf('nope'), '');
});

test('diffDaysYMD counts calendar days across months and years', () => {
  assert.equal(diffDaysYMD('2026-01-30', '2026-02-02'), 3);
  assert.equal(diffDaysYMD('2025-12-31', '2026-01-01'), 1);
  assert.equal(diffDaysYMD('2026-03-10', '2026-03-01'), -9);
  assert.equal(diffDaysYMD('x', '2026-01-01'), null);
});

test('overdueDays is 0 until the due date has passed', () => {
  assert.equal(overdueDays('2026-10-13', '2026-10-13'), 0);
  assert.equal(overdueDays('2026-10-13', '2026-10-12'), 0);
  assert.equal(overdueDays('2026-10-10', '2026-10-13'), 3);
  assert.equal(overdueDays('2026-10-10T00:00:00.000Z', '2026-10-13'), 3);
  assert.equal(overdueDays(undefined, '2026-10-13'), 0);
});

test('isLoanOverdue / loanDisplayStatus only flag open loans', () => {
  const today = '2026-10-13';
  assert.equal(isLoanOverdue({ status: 'issued', dueDate: '2026-10-12' }, today), true);
  assert.equal(isLoanOverdue({ status: 'returned', dueDate: '2026-10-12' }, today), false);
  assert.equal(loanDisplayStatus({ status: 'issued', dueDate: '2026-10-12' }, today), 'overdue');
  assert.equal(loanDisplayStatus({ status: 'issued', dueDate: '2026-10-20' }, today), 'issued');
  assert.equal(loanDisplayStatus({ status: 'lost', dueDate: '2026-10-01' }, today), 'lost');
});

test('previewFine: (lateDays − grace) × perDay, capped', () => {
  const settings = { finePerDay: 5, graceDays: 2, maxFinePerLoan: null };
  assert.deepEqual(previewFine({ dueDate: '2026-10-01', returnedAt: '2026-10-01', settings }), {
    days: 0,
    amount: 0,
  });
  // 2 days late, 2 grace → nothing
  assert.deepEqual(previewFine({ dueDate: '2026-10-01', returnedAt: '2026-10-03', settings }), {
    days: 0,
    amount: 0,
  });
  // 10 days late − 2 grace = 8 × 5
  assert.deepEqual(previewFine({ dueDate: '2026-10-01', returnedAt: '2026-10-11', settings }), {
    days: 8,
    amount: 40,
  });
  // capped
  assert.deepEqual(
    previewFine({
      dueDate: '2026-10-01',
      returnedAt: '2026-10-31',
      settings: { finePerDay: 5, graceDays: 0, maxFinePerLoan: 100 },
    }),
    { days: 30, amount: 100 },
  );
  // a 0 cap means "no cap"
  assert.equal(
    previewFine({
      dueDate: '2026-10-01',
      returnedAt: '2026-10-31',
      settings: { finePerDay: 5, maxFinePerLoan: 0 },
    }).amount,
    150,
  );
  // returned early
  assert.equal(
    previewFine({ dueDate: '2026-10-10', returnedAt: '2026-10-01', settings }).amount,
    0,
  );
  // fractional per-day rates round to paise
  assert.equal(
    previewFine({
      dueDate: '2026-10-01',
      returnedAt: '2026-10-04',
      settings: { finePerDay: 0.1 },
    }).amount,
    0.3,
  );
});

test('defaultDueDate adds loan days to the issue date', () => {
  assert.equal(defaultDueDate('2026-10-13', 14), '2026-10-27');
  assert.equal(defaultDueDate('2026-12-25', 30), '2027-01-24');
  assert.equal(defaultDueDate('2026-10-13', 0), '2026-10-27');
  assert.equal(defaultDueDate('2026-10-13', '7'), '2026-10-20');
});

test('validateDueDate keeps the override within 1–90 days', () => {
  assert.equal(validateDueDate('2026-10-14', '2026-10-13'), '');
  assert.equal(validateDueDate('2027-01-11', '2026-10-13'), '');
  assert.match(validateDueDate('2026-10-13', '2026-10-13'), /after/);
  assert.match(validateDueDate('2027-01-12', '2026-10-13'), /90/);
  assert.match(validateDueDate('', '2026-10-13'), /valid/);
});

test('limitsFor falls back to the built-in defaults', () => {
  assert.deepEqual(limitsFor(null, 'student'), { maxBooks: 2, loanDays: 14 });
  assert.deepEqual(limitsFor({ staff: { maxBooks: 8, loanDays: 21 } }, 'staff'), {
    maxBooks: 8,
    loanDays: 21,
  });
});

test('splitList splits on commas/semicolons/newlines and de-duplicates', () => {
  assert.deepEqual(splitList('A. Khan, B. Ali; A. Khan\nC'), ['A. Khan', 'B. Ali', 'C']);
  assert.deepEqual(splitList(''), []);
  assert.deepEqual(splitList([' x ', '', 'x']), ['x']);
});

test('buildBookPayload drops empty optionals on create and clears them on edit', () => {
  const create = buildBookPayload(
    { title: ' Maths ', authors: 'X, Y', isbn: '', year: '2020', copies: '3', branchId: 'b1' },
    { isCreate: true },
  );
  assert.deepEqual(create, {
    title: 'Maths',
    authors: ['X', 'Y'],
    year: 2020,
    tags: [],
    branchId: 'b1',
    copies: 3,
  });
  const edit = buildBookPayload({ title: 'Maths', authors: 'X', isbn: '', year: '' });
  assert.equal(edit.isbn, '');
  assert.equal(edit.year, null);
  assert.equal('copies' in edit, false);
});

test('buildLoanListParams keeps only set filters', () => {
  assert.deepEqual(
    buildLoanListParams({ status: 'overdue', borrowerType: '', from: '2026-10-01', to: '' }),
    { status: 'overdue', from: '2026-10-01' },
  );
});

test('loanRowActions', () => {
  const today = '2026-10-13';
  const open = { status: 'issued', dueDate: '2026-10-20', renewals: 0, borrowerType: 'student' };
  assert.deepEqual(loanRowActions(open, { canManage: false, today }), []);
  assert.deepEqual(loanRowActions(open, { canManage: true, today }), ['return', 'renew', 'lost']);
  assert.deepEqual(loanRowActions({ ...open, renewals: 2 }, { canManage: true, today }), [
    'return',
    'lost',
  ]);
  assert.deepEqual(loanRowActions({ ...open, dueDate: '2026-10-01' }, { canManage: true, today }), [
    'return',
    'lost',
  ]);
  assert.deepEqual(
    loanRowActions(
      { status: 'returned', borrowerType: 'staff', fine: { status: 'pending', amount: 10 } },
      { canManage: true, today },
    ),
    ['waive', 'fine-paid'],
  );
  assert.deepEqual(
    loanRowActions(
      { status: 'returned', borrowerType: 'student', fine: { status: 'pending' } },
      { canManage: true, today },
    ),
    ['waive'],
  );
  assert.deepEqual(
    loanRowActions(
      { status: 'returned', borrowerType: 'student', fine: { status: 'billed' } },
      { canManage: true, today },
    ),
    [],
  );
});

test('pendingFineTotal accepts an amount, an object or a list', () => {
  assert.equal(pendingFineTotal(25), 25);
  assert.equal(pendingFineTotal({ amount: 12.5 }), 12.5);
  assert.equal(pendingFineTotal([{ fine: { amount: 10 } }, { amount: 5 }]), 15);
  assert.equal(pendingFineTotal(undefined), 0);
});

test('loan borrower / accession helpers tolerate populated and raw refs', () => {
  const loan = {
    borrowerType: 'student',
    studentId: { _id: 's1', user: { name: 'Ali' } },
    copyId: { accessionNumber: 'ACC-000001' },
  };
  assert.equal(loanBorrowerName(loan), 'Ali');
  assert.equal(loanBorrowerId(loan), 's1');
  assert.equal(loanAccession(loan), 'ACC-000001');
  assert.equal(loanBorrowerId({ borrowerType: 'staff', staffId: 'st9' }), 'st9');
  assert.equal(loanBorrowerName({ borrowerType: 'staff', staffId: 'st9' }), 'Staff');
});

test('settings form round-trip', () => {
  const form = settingsToForm({
    student: { maxBooks: 3, loanDays: 10 },
    staff: { maxBooks: 6, loanDays: 20 },
    finePerDay: 2,
    maxFinePerLoan: null,
    graceDays: 1,
  });
  assert.equal(form.maxFinePerLoan, '');
  assert.deepEqual(buildSettingsPayload(form, ''), {
    branchId: null,
    student: { maxBooks: 3, loanDays: 10 },
    staff: { maxBooks: 6, loanDays: 20 },
    finePerDay: 2,
    maxFinePerLoan: null,
    graceDays: 1,
  });
  assert.equal(buildSettingsPayload({ ...form, maxFinePerLoan: '150' }, 'b1').maxFinePerLoan, 150);
  assert.equal(buildSettingsPayload(form, 'b1').branchId, 'b1');
});

test('copies per request match the API limit', () => {
  assert.equal(MAX_COPIES_PER_REQUEST, 200);
});
