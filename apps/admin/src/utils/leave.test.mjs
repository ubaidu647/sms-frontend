// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  leaveTypesFor,
  parseYMDUtc,
  calendarSpan,
  leaveYearOf,
  validateLeaveDates,
  countWorkingDays,
  leaveDateYMD,
  formatLeaveRange,
  buildLeaveListParams,
  leaveRowActions,
  canCancelOwn,
  parseQuota,
  buildQuotas,
  policyFor,
  isLeaveRequestRow,
  keptAsLeaveCount,
  keptAsLeaveMessage,
  responseWarnings,
  applicantDetail,
  requestedByLabel,
} from './leave.js';

test('leaveTypesFor: staff vs student', () => {
  assert.deepEqual(leaveTypesFor('student'), ['sick', 'casual', 'other']);
  assert.ok(leaveTypesFor('staff').includes('unpaid'));
  assert.ok(leaveTypesFor('staff').includes('annual'));
});

test('parseYMDUtc rejects impossible dates', () => {
  assert.equal(parseYMDUtc('2026-02-30'), null);
  assert.equal(parseYMDUtc('2026-13-01'), null);
  assert.equal(parseYMDUtc('20260101'), null);
  assert.equal(parseYMDUtc('2026-01-01'), Date.UTC(2026, 0, 1));
});

test('calendarSpan inclusive; 0 when reversed', () => {
  assert.equal(calendarSpan('2026-10-01', '2026-10-01'), 1);
  assert.equal(calendarSpan('2026-10-01', '2026-10-10'), 10);
  assert.equal(calendarSpan('2026-10-10', '2026-10-01'), 0);
  assert.equal(calendarSpan('2026-02-27', '2026-03-02'), 4);
});

test('leaveYearOf honours start month', () => {
  assert.equal(leaveYearOf('2026-03-31', 4), '2025-2026');
  assert.equal(leaveYearOf('2026-04-01', 4), '2026-2027');
  assert.equal(leaveYearOf('2026-01-15', 1), '2026-2027');
  assert.equal(leaveYearOf('bad', 4), '');
});

test('validateLeaveDates', () => {
  assert.equal(validateLeaveDates('2026-10-01', '2026-10-05', 4), '');
  assert.match(validateLeaveDates('2026-10-05', '2026-10-01', 4), /on or after/);
  assert.match(validateLeaveDates('', '2026-10-01', 4), /start date/);
  assert.match(validateLeaveDates('2026-10-01', '2026-12-31', 4), /at most 60/);
  assert.match(validateLeaveDates('2026-03-30', '2026-04-02', 4), /two leave years/);
  // 60 days exactly is allowed
  assert.equal(validateLeaveDates('2026-10-01', '2026-11-29', 4), '');
});

test('countWorkingDays defaults to Mon–Sat', () => {
  // 2026-10-04 is a Sunday; 2026-10-05..10 Mon..Sat
  assert.equal(countWorkingDays('2026-10-04', '2026-10-10'), 6);
  assert.equal(countWorkingDays('2026-10-04', '2026-10-04'), 0);
  assert.equal(countWorkingDays('2026-10-05', '2026-10-09', ['monday', 'tuesday']), 2);
  assert.equal(countWorkingDays('2026-10-09', '2026-10-05'), 0);
});

test('leaveDateYMD keeps UTC date of stored values', () => {
  assert.equal(leaveDateYMD('2026-10-05T00:00:00.000Z'), '2026-10-05');
  assert.equal(leaveDateYMD('2026-10-05'), '2026-10-05');
  assert.equal(leaveDateYMD(null), '');
  assert.equal(formatLeaveRange('2026-10-05', '2026-10-05'), '2026-10-05');
  assert.equal(formatLeaveRange('2026-10-05', '2026-10-07'), '2026-10-05 → 2026-10-07');
  assert.equal(formatLeaveRange(null, null), '—');
});

test('buildLeaveListParams drops empties and inapplicable fields', () => {
  assert.deepEqual(
    buildLeaveListParams({
      applicantType: 'staff',
      status: '',
      branchId: 'b1',
      from: '2026-10-01',
      to: '',
      staffId: 's1',
      classId: 'c1',
      sectionId: 'x',
    }),
    { applicantType: 'staff', branchId: 'b1', from: '2026-10-01', staffId: 's1' },
  );
  assert.deepEqual(
    buildLeaveListParams({
      applicantType: 'student',
      classId: 'c1',
      sectionId: 's1',
      staffId: 'x',
    }),
    { applicantType: 'student', classId: 'c1', sectionId: 's1' },
  );
  assert.deepEqual(buildLeaveListParams({}), {});
});

test('leaveRowActions by status and permission', () => {
  assert.deepEqual(leaveRowActions({ status: 'pending' }, { canApprove: true }), [
    'view',
    'approve',
    'reject',
    'cancel',
  ]);
  assert.deepEqual(leaveRowActions({ status: 'approved' }, { canApprove: true }), [
    'view',
    'cancel',
  ]);
  assert.deepEqual(leaveRowActions({ status: 'rejected' }, { canApprove: true }), ['view']);
  assert.deepEqual(leaveRowActions({ status: 'pending' }, { canApprove: false }), ['view']);
  assert.equal(canCancelOwn({ status: 'pending' }), true);
  assert.equal(canCancelOwn({ status: 'approved' }), false);
});

test('parseQuota / buildQuotas', () => {
  assert.equal(parseQuota(''), 0);
  assert.equal(parseQuota('5'), 5);
  assert.equal(parseQuota('-1'), null);
  assert.equal(parseQuota('1.5'), null);
  assert.deepEqual(buildQuotas({ casual: '10', sick: 8, annual: '', other: '0' }), {
    quotas: { casual: 10, sick: 8, annual: 0, other: 0 },
  });
  assert.match(buildQuotas({ casual: 'x' }).error, /Casual/);
});

test('policyFor falls back to zero quotas / none', () => {
  const data = {
    policies: [{ staffType: 'teaching', quotas: { casual: 10, sick: 5 }, source: 'school' }],
  };
  assert.deepEqual(policyFor(data, 'teaching'), {
    staffType: 'teaching',
    quotas: { casual: 10, sick: 5, annual: 0, other: 0 },
    source: 'school',
  });
  assert.equal(policyFor(data, 'non-teaching').source, 'none');
  assert.equal(policyFor(undefined, 'teaching').quotas.casual, 0);
});

test('isLeaveRequestRow needs status leave and a request id', () => {
  assert.equal(isLeaveRequestRow({ status: 'leave', leaveRequestId: 'r1' }), true);
  assert.equal(isLeaveRequestRow({ status: 'leave' }), false);
  assert.equal(isLeaveRequestRow({ status: 'present', leaveRequestId: 'r1' }), false);
  assert.equal(isLeaveRequestRow(null), false);
});

test('applicant labels', () => {
  assert.equal(
    applicantDetail({ applicant: { kind: 'staff', designation: 'Teacher' } }),
    'Teacher',
  );
  assert.equal(
    applicantDetail({
      applicant: { kind: 'student', className: 'One', sectionName: 'A', admissionNumber: '12' },
    }),
    'One - A · 12',
  );
  assert.equal(requestedByLabel({ requestedBy: { role: 'parent' } }), 'Parent');
  assert.equal(requestedByLabel({ requestedBy: { role: 'self' } }), 'Self');
  assert.equal(requestedByLabel({}), '—');
});

test('keptAsLeaveCount counts only rows changed to absent on a leave day', () => {
  const leave = { status: 'leave', leaveRequestId: 'r1' };
  const roster = [
    { studentId: 'a', attendance: leave },
    { studentId: 'b', attendance: leave },
    { studentId: 'c', attendance: { status: 'present' } },
    { studentId: 'd', attendance: { status: 'leave' } }, // manual leave, no request
  ];
  // Unchanged leave rows: nothing to report.
  const same = roster.map((r) => ({ studentId: r.studentId, status: r.attendance.status }));
  assert.equal(keptAsLeaveCount(roster, same, 'studentId'), 0);
  const changed = [
    { studentId: 'a', status: 'absent' },
    { studentId: 'b', status: 'present' }, // released, not kept
    { studentId: 'c', status: 'absent' }, // not a leave day
    { studentId: 'd', status: 'absent' },
  ];
  assert.equal(keptAsLeaveCount(roster, changed, 'studentId'), 1);
  assert.equal(
    keptAsLeaveCount(
      [{ staffId: 's', attendance: leave }],
      [{ staffId: 's', status: 'absent' }],
      'staffId',
    ),
    1,
  );
  assert.equal(keptAsLeaveCount(undefined, undefined, 'studentId'), 0);
});

test('keptAsLeaveMessage', () => {
  assert.equal(keptAsLeaveMessage(0), '');
  assert.equal(keptAsLeaveMessage(1), '1 on approved leave was kept as leave');
  assert.equal(keptAsLeaveMessage(4), '4 on approved leave were kept as leave');
});

test('responseWarnings reads data or envelope', () => {
  assert.deepEqual(responseWarnings({ data: { warnings: ['x', '', 3] } }), ['x']);
  assert.deepEqual(responseWarnings({ warnings: ['y'] }), ['y']);
  assert.deepEqual(responseWarnings({ data: {} }), []);
  assert.deepEqual(responseWarnings(undefined), []);
});
