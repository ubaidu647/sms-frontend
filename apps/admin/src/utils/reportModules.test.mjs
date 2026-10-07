// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { allowedReportModules } from './reportModules.js';

const ungated = ['transport', 'timetable', 'announcements'];
const sorted = (set) => [...set].sort();

test('predefined roles may include every module', () => {
  const got = allowedReportModules(
    { isPredefined: true },
    { studentBranchId: 'b2', userBranchId: 'b1' },
  );
  assert.deepEqual(sorted(got), sorted(['attendance', 'exams', 'homework', 'fees', ...ungated]));
});

test('a role without module actions only gets the ungated modules', () => {
  const got = allowedReportModules({ actions: ['view-student'] });
  assert.deepEqual(sorted(got), sorted(ungated));
});

test('branch-tier grants only reach students of the own branch', () => {
  const role = { actions: ['view-attendance', 'view-homework'] };
  assert.deepEqual(
    sorted(allowedReportModules(role, { studentBranchId: 'b1', userBranchId: 'b1' })),
    sorted(['attendance', 'homework', ...ungated]),
  );
  assert.deepEqual(
    sorted(allowedReportModules(role, { studentBranchId: 'b2', userBranchId: 'b1' })),
    sorted(ungated),
  );
  // No student picked yet → permission alone decides.
  assert.ok(allowedReportModules(role, { userBranchId: 'b1' }).has('attendance'));
});

test('all-branch grants reach any branch; populated branch refs are unwrapped', () => {
  const role = { actions: ['view-all-branch-fee', 'view-all-branch-marks'] };
  const got = allowedReportModules(role, { studentBranchId: { _id: 'b2' }, userBranchId: 'b1' });
  assert.ok(got.has('fees'));
  assert.ok(got.has('exams'));
  assert.ok(!got.has('attendance'));
});

test('own-tier grants do not unlock a module', () => {
  const got = allowedReportModules({ actions: ['view-own-attendance'] });
  assert.ok(!got.has('attendance'));
});
