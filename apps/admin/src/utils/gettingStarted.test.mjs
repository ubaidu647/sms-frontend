// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChecklist,
  countOf,
  hasBranchProfile,
  sectionCountOf,
  visibleQuickLinks,
  visibleSteps,
} from './gettingStarted.js';

const admin = { isPredefined: true };
const ok = (value) => ({ status: 'ok', value });

test('countOf prefers total, falls back to the page, survives junk', () => {
  assert.equal(countOf({ total: 7, data: [1] }), 7);
  assert.equal(countOf({ data: [1, 2] }), 2);
  assert.equal(countOf(undefined), 0);
  assert.equal(countOf({ data: null }), 0);
});

test('sections are summed from the class rows', () => {
  assert.equal(sectionCountOf({ data: [{ sectionCount: 2 }, { sectionCount: 1 }, {}] }), 3);
  assert.equal(sectionCountOf(null), 0);
});

test('branch profile: object, null, or an org-level list', () => {
  assert.equal(hasBranchProfile({ data: { _id: 'x' } }), true);
  assert.equal(hasBranchProfile({ data: null }), false);
  assert.equal(hasBranchProfile({ data: [] }), false);
  assert.equal(hasBranchProfile({ data: [{}] }), true);
});

test('steps the role cannot read are hidden', () => {
  const clerk = { actions: ['view-student'] };
  assert.deepEqual(
    visibleSteps(clerk).map((s) => s.key),
    ['students'],
  );
  assert.equal(visibleSteps(admin).length, 7);
  assert.equal(visibleSteps(null).length, 0);
});

test('empty school: everything pending, cash step hidden while auto-post is off', () => {
  const rows = buildChecklist(admin, {
    branchProfile: ok({ data: null }),
    classes: ok({ data: [], total: 0 }),
    subjects: ok({ data: [], total: 0 }),
    staff: ok({ data: [], total: 0 }),
    students: ok({ data: [], total: 0 }),
    feeStructure: ok({ data: [], total: 0 }),
    cashAccount: ok({ data: { autoPostEnabled: false, missingCash: [{ name: 'Main' }] } }),
  });
  assert.equal(rows.length, 6);
  assert.ok(rows.every((r) => r.state === 'pending'));
});

test('classes need a section too; cash step reports missing branches', () => {
  const rows = buildChecklist(admin, {
    classes: ok({ data: [{ sectionCount: 0 }], total: 1 }),
    cashAccount: ok({ data: { autoPostEnabled: true, missingCash: [{ name: 'North' }] } }),
  });
  const classes = rows.find((r) => r.key === 'classes');
  assert.equal(classes.state, 'pending');
  const cash = rows.find((r) => r.key === 'cashAccount');
  assert.equal(cash.state, 'pending');
  assert.match(cash.detail, /North/);
});

test('done states, loading rows, and failed/forbidden sources left out', () => {
  const rows = buildChecklist(admin, {
    branchProfile: { status: 'error' },
    classes: ok({ data: [{ sectionCount: 2 }], total: 1 }),
    students: ok({ total: 120 }),
    staff: { status: 'loading' },
    cashAccount: ok({ data: { autoPostEnabled: true, missingCash: [] } }),
  });
  assert.equal(
    rows.find((r) => r.key === 'branchProfile'),
    undefined,
  );
  assert.equal(rows.find((r) => r.key === 'classes').state, 'done');
  assert.equal(rows.find((r) => r.key === 'students').state, 'done');
  assert.equal(rows.find((r) => r.key === 'staff').state, 'loading');
  assert.equal(rows.find((r) => r.key === 'cashAccount').state, 'done');
});

test('quick links follow permissions; Change password is always there', () => {
  assert.deepEqual(
    visibleQuickLinks({ actions: [] }).map((l) => l.label),
    ['Change password'],
  );
  assert.equal(visibleQuickLinks(admin).length, 7);
});
