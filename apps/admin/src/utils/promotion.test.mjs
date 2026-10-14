// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  targetKind,
  isProcessed,
  allowedDecisions,
  defaultDecision,
  remainingRoom,
  pickDefaultTarget,
  plannedLoad,
  setDecisions,
  buildDefaultPlan,
  missingTargets,
  toApplyPayload,
  countDecisions,
  summarizeSections,
  progressPercent,
  unprocessedRows,
} from './promotion.js';

const T = (id, name, capacity, currentStrength) => ({ _id: id, name, capacity, currentStrength });

test('targetKind / isProcessed', () => {
  assert.equal(targetKind('promote'), 'promote');
  assert.equal(targetKind('detain'), 'detain');
  assert.equal(targetKind('left'), null);
  assert.equal(targetKind('passout'), null);
  assert.equal(isProcessed({}), false);
  assert.equal(isProcessed({ record: { decision: 'promote', undone: false } }), true);
  assert.equal(isProcessed({ record: { decision: 'promote', undone: true } }), false);
});

test('allowed / default decisions depend on the last grade', () => {
  assert.deepEqual(allowedDecisions(false, {}), ['promote', 'detain', 'left']);
  assert.deepEqual(allowedDecisions(true, {}), ['passout', 'detain', 'left']);
  assert.ok(allowedDecisions(false, { suggested: 'passout' }).includes('passout'));
  assert.equal(defaultDecision({ suggested: 'promote' }, false), 'promote');
  assert.equal(defaultDecision({}, false), 'promote');
  assert.equal(defaultDecision({ suggested: 'promote' }, true), 'passout');
  assert.equal(defaultDecision({ suggested: 'passout' }, false), 'passout');
});

test('remainingRoom', () => {
  assert.equal(remainingRoom(T('a', 'A', 40, 30)), 10);
  assert.equal(remainingRoom(T('a', 'A', 40, 30), 4), 6);
  assert.equal(remainingRoom({ name: 'x' }), Infinity);
});

test('pickDefaultTarget: same name, else first with room, else same/first', () => {
  const targets = [T('a', 'A', 2, 0), T('b', 'B', 2, 2), T('c', 'Blue', 2, 0)];
  assert.equal(pickDefaultTarget(targets, 'blue'), 'c');
  assert.equal(pickDefaultTarget(targets, ' Blue '), 'c');
  assert.equal(pickDefaultTarget(targets, 'Red'), 'a');
  // same-name section is full → first with room
  assert.equal(pickDefaultTarget(targets, 'B'), 'a');
  // planned load fills A → next with room
  assert.equal(pickDefaultTarget(targets, 'A', { a: 2 }), 'c');
  // everything full → same name, else first
  assert.equal(pickDefaultTarget(targets, 'B', { a: 2, c: 2 }), 'b');
  assert.equal(pickDefaultTarget(targets, 'Red', { a: 2, c: 2 }), 'a');
  assert.equal(pickDefaultTarget([], 'A'), '');
  assert.equal(pickDefaultTarget(undefined, 'A'), '');
});

test('buildDefaultPlan fills sections in order and skips processed students', () => {
  const targets = {
    promote: [T('p1', 'A', 3, 1), T('p2', 'B', 5, 0)],
    detain: [T('d1', 'A', 40, 39)],
  };
  const students = [
    { _id: 's1', suggested: 'promote' },
    { _id: 's2', suggested: 'promote' },
    { _id: 's3', suggested: 'promote' },
    { _id: 's4', suggested: 'promote', record: { decision: 'left', undone: false } },
    { _id: 's5', suggested: 'promote', record: { decision: 'left', undone: true } },
  ];
  const plan = buildDefaultPlan({ students, targets, fromSectionName: 'A', isLastGrade: false });
  assert.deepEqual(Object.keys(plan).sort(), ['s1', 's2', 's3', 's5']);
  assert.equal(plan.s1.toSectionId, 'p1');
  assert.equal(plan.s2.toSectionId, 'p1');
  assert.equal(plan.s3.toSectionId, 'p2'); // A has 2 seats left
  assert.equal(plan.s5.toSectionId, 'p2');
  assert.deepEqual(plannedLoad(plan), { p1: 2, p2: 2 });
});

test('buildDefaultPlan for the last grade passes everyone out (no target)', () => {
  const plan = buildDefaultPlan({
    students: [{ _id: 's1', suggested: 'passout' }],
    targets: { promote: [], detain: [T('d', 'A', 10, 0)] },
    fromSectionName: 'A',
    isLastGrade: true,
  });
  assert.deepEqual(plan, { s1: { decision: 'passout', toSectionId: '' } });
});

test('setDecisions re-targets only the given students, respecting other load', () => {
  const targets = {
    promote: [T('p1', 'A', 2, 0), T('p2', 'B', 9, 0)],
    detain: [T('d1', 'A', 5, 0)],
  };
  let plan = setDecisions({}, ['s1', 's2', 's3'], 'promote', { targets, fromSectionName: 'A' });
  assert.deepEqual(
    ['s1', 's2', 's3'].map((id) => plan[id].toSectionId),
    ['p1', 'p1', 'p2'],
  );
  plan = setDecisions(plan, ['s1'], 'detain', { targets, fromSectionName: 'A' });
  assert.deepEqual(plan.s1, { decision: 'detain', toSectionId: 'd1' });
  plan = setDecisions(plan, ['s2'], 'left', { targets, fromSectionName: 'A' });
  assert.deepEqual(plan.s2, { decision: 'left', toSectionId: '' });
  // p1 now has room again for s3
  plan = setDecisions(plan, ['s3'], 'promote', { targets, fromSectionName: 'A' });
  assert.equal(plan.s3.toSectionId, 'p1');
});

test('missingTargets / toApplyPayload / countDecisions', () => {
  const plan = {
    a: { decision: 'promote', toSectionId: 'x' },
    b: { decision: 'detain', toSectionId: '' },
    c: { decision: 'left', toSectionId: '' },
    d: { decision: 'passout', toSectionId: 'ignored' },
  };
  assert.deepEqual(missingTargets(plan, ['a', 'b', 'c', 'd', 'zz']), ['b', 'zz']);
  assert.deepEqual(toApplyPayload(plan, ['a', 'c', 'd']), [
    { studentId: 'a', decision: 'promote', toSectionId: 'x' },
    { studentId: 'c', decision: 'left' },
    { studentId: 'd', decision: 'passout' },
  ]);
  assert.deepEqual(countDecisions(plan), { promote: 1, detain: 1, left: 1, passout: 1 });
  assert.deepEqual(countDecisions(plan, ['a']), { promote: 1, detain: 0, left: 0, passout: 0 });
});

test('summarizeSections / progressPercent', () => {
  const s = summarizeSections([
    { students: 30, processed: 30 },
    { students: 20, processed: 5 },
    { students: 0, processed: 0 },
  ]);
  assert.deepEqual(s, {
    students: 50,
    processed: 35,
    remaining: 15,
    sectionsDone: 2,
    sectionsTotal: 3,
  });
  assert.deepEqual(summarizeSections(undefined), {
    students: 0,
    processed: 0,
    remaining: 0,
    sectionsDone: 0,
    sectionsTotal: 0,
  });
  assert.equal(progressPercent(5, 20), 25);
  assert.equal(progressPercent(0, 0), 100);
  assert.equal(progressPercent(1, 3), 33);
});

test('unprocessedRows normalises the refused-complete payload', () => {
  assert.deepEqual(
    unprocessedRows([
      { className: 'Grade 5', sectionName: 'A', count: 3 },
      { fromClass: { name: 'Grade 6' }, fromSection: { name: 'B' }, students: 2 },
      { sectionName: 'C', count: 0 },
    ]),
    [
      { label: 'Grade 5 – A', count: 3 },
      { label: 'Grade 6 – B', count: 2 },
    ],
  );
  assert.deepEqual(unprocessedRows({ sections: [{ name: 'A', count: 4 }] }), [
    { label: 'A', count: 4 },
  ]);
  assert.deepEqual(unprocessedRows({ 'Grade 1 – A': 2, total: 0 }), [
    { label: 'Grade 1 – A', count: 2 },
  ]);
  assert.deepEqual(unprocessedRows(null), []);
});
