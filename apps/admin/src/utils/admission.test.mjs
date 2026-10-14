// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CLASS_GRADES,
  GRADE_OPTIONS,
  gradeLabel,
  STAFF_SOURCES,
  isOpenStatus,
  buildEnquiryListParams,
  toYMD,
  followUpState,
  isoToLocalInput,
  localInputToIso,
  enquiryActions,
  admissionPermissions,
  canManageEnquiry,
  enquiryTimeline,
  enquiryFormValues,
  buildEnquiryPayload,
  classForGrade,
  isDifferentGrade,
  sectionFull,
  admitPrefill,
  parentPrefillFromEnquiry,
  buildAdmitPayload,
  voucherOutcome,
  normalizeForms,
  formForBranch,
  publicApplyUrl,
  sumCounts,
} from './admission.js';

test('grades mirror the backend enum order with readable labels', () => {
  assert.deepEqual(CLASS_GRADES.slice(0, 4), ['nursery', 'kg-1', 'kg-2', '1']);
  assert.equal(CLASS_GRADES.at(-1), '12');
  assert.equal(CLASS_GRADES.length, 15);
  assert.equal(gradeLabel('nursery'), 'Nursery');
  assert.equal(gradeLabel('kg-2'), 'KG-2');
  assert.equal(gradeLabel('7'), 'Grade 7');
  assert.equal(gradeLabel(''), '—');
  assert.deepEqual(GRADE_OPTIONS[1], { value: 'kg-1', label: 'KG-1' });
});

test('staff sources exclude online', () => {
  assert.ok(!STAFF_SOURCES.includes('online'));
  assert.ok(STAFF_SOURCES.includes('walk-in'));
});

test('isOpenStatus', () => {
  assert.equal(isOpenStatus('new'), true);
  assert.equal(isOpenStatus('test-done'), true);
  assert.equal(isOpenStatus('admitted'), false);
  assert.equal(isOpenStatus('closed'), false);
  assert.equal(isOpenStatus(''), false);
});

test('buildEnquiryListParams drops empties and trims', () => {
  assert.deepEqual(
    buildEnquiryListParams({ status: 'new', search: '  ali ', source: '', junk: 'x', from: '' }),
    { status: 'new', search: 'ali' },
  );
  assert.deepEqual(buildEnquiryListParams(), {});
});

test('toYMD / followUpState', () => {
  assert.equal(toYMD('2026-10-12T00:00:00.000Z'), '2026-10-12');
  assert.equal(toYMD('2026-10-12'), '2026-10-12');
  assert.equal(toYMD(''), '');
  assert.equal(toYMD('garbage'), '');
  const e = (d, status = 'new') => ({ status, nextFollowUpDate: d });
  assert.equal(followUpState(e('2026-10-11T00:00:00.000Z'), '2026-10-12'), 'overdue');
  assert.equal(followUpState(e('2026-10-12T00:00:00.000Z'), '2026-10-12'), 'today');
  assert.equal(followUpState(e('2026-10-13'), '2026-10-12'), 'upcoming');
  assert.equal(followUpState(e('2026-10-01', 'closed'), '2026-10-12'), '');
  assert.equal(followUpState(e(null), '2026-10-12'), '');
});

test('datetime-local round trip', () => {
  const local = '2026-10-12T09:30';
  const iso = localInputToIso(local);
  assert.match(iso, /Z$/);
  assert.equal(isoToLocalInput(iso), local);
  assert.equal(localInputToIso(''), '');
  assert.equal(isoToLocalInput('bad'), '');
});

test('enquiryActions follow the status rules', () => {
  const m = { canManage: true, canAdmit: true };
  assert.deepEqual(enquiryActions({ status: 'new' }, m), [
    'follow-up',
    'schedule-test',
    'edit',
    'close',
    'admit',
  ]);
  assert.ok(
    enquiryActions({ status: 'test-scheduled', test: { scheduledAt: 'x' } }, m).includes(
      'record-result',
    ),
  );
  assert.deepEqual(enquiryActions({ status: 'closed' }, m), ['reopen']);
  assert.deepEqual(enquiryActions({ status: 'admitted' }, m), []);
  assert.deepEqual(enquiryActions({ status: 'new' }, { canManage: false }), []);
  assert.ok(!enquiryActions({ status: 'new' }, { canManage: true }).includes('admit'));
});

test('admissionPermissions and branch reach', () => {
  const role = { actions: ['view-enquiry', 'manage-enquiry', 'create-student'] };
  const p = admissionPermissions(role);
  assert.equal(p.canView, true);
  assert.equal(p.canManageAny, true);
  assert.equal(p.canForms, false);
  assert.equal(p.canCreateStudent, true);
  assert.equal(p.canGenerateVoucher, false);
  assert.equal(admissionPermissions({ isPredefined: true }).canForms, true);
  assert.equal(canManageEnquiry(role, 'b1', { branchId: 'b1' }), true);
  assert.equal(canManageEnquiry(role, 'b1', { branchId: { _id: 'b2' } }), false);
  assert.equal(
    canManageEnquiry({ actions: ['manage-all-branch-enquiry'] }, 'b1', { branchId: 'b2' }),
    true,
  );
});

test('enquiryTimeline orders events chronologically', () => {
  const items = enquiryTimeline({
    source: 'phone',
    status: 'test-done',
    createdAt: '2026-10-01T10:00:00Z',
    followUps: [{ note: 'Called', at: '2026-10-03T10:00:00Z', byName: 'Sara' }],
    test: {
      scheduledAt: '2026-10-05T09:00:00Z',
      venue: 'Room 1',
      result: 'pass',
      marks: 40,
      recordedAt: '2026-10-05T12:00:00Z',
    },
  });
  assert.deepEqual(
    items.map((i) => i.kind),
    ['created', 'follow-up', 'test-scheduled', 'test-result'],
  );
  assert.match(items[3].title, /pass · 40 marks/);
  assert.deepEqual(enquiryTimeline(null), []);
});

test('enquiry form values and payload', () => {
  const v = enquiryFormValues(
    {
      branchId: { _id: 'b1' },
      source: 'online',
      academicYear: '2026-2027',
      desiredGrade: '5',
      child: { name: 'Ali', dob: '2018-03-04T00:00:00.000Z' },
      guardian: { name: 'Khan', relation: 'father', phone: '0300' },
      nextFollowUpDate: '2026-10-20T00:00:00.000Z',
      assignedTo: { _id: 's1' },
    },
    {},
  );
  assert.equal(v.branchId, 'b1');
  assert.equal(v.child.dob, '2018-03-04');
  assert.equal(v.assignedTo, 's1');
  const edit = buildEnquiryPayload(v, { isEdit: true });
  assert.equal('source' in edit, false, 'online source is never re-sent');
  assert.equal(edit.notes, '', 'blank optional cleared on edit');
  assert.deepEqual(edit.child, { name: 'Ali', dob: '2018-03-04' });
  const create = buildEnquiryPayload(
    { ...v, source: 'walk-in', notes: '', branchId: 'b9' },
    { includeBranch: true },
  );
  assert.equal(create.source, 'walk-in');
  assert.equal(create.branchId, 'b9');
  assert.equal('notes' in create, false);
  assert.equal(enquiryFormValues(null, { academicYear: '2026-2027' }).academicYear, '2026-2027');
});

test('class/section helpers', () => {
  const classes = [
    { _id: 'c1', grade: '4' },
    { _id: 'c2', grade: '5' },
  ];
  assert.equal(classForGrade(classes, '5')._id, 'c2');
  assert.equal(classForGrade(classes, '9'), null);
  assert.equal(isDifferentGrade(classes, 'c1', '5'), true);
  assert.equal(isDifferentGrade(classes, 'c2', '5'), false);
  assert.equal(isDifferentGrade(classes, '', '5'), false);
  assert.equal(sectionFull({ capacity: 30, currentStrength: 30 }), true);
  assert.equal(sectionFull({ capacity: 30, currentStrength: 2 }), false);
});

test('admitPrefill maps the guardian by relation', () => {
  const base = {
    academicYear: '2026-2027',
    child: { name: 'Ali', gender: 'male', dob: '2018-03-04T00:00:00.000Z', previousSchool: 'ABC' },
    address: 'Street 1',
  };
  const f = admitPrefill(
    { ...base, guardian: { name: 'Khan', relation: 'father', phone: '0300', email: 'k@x.pk' } },
    { today: '2026-10-12' },
  );
  assert.equal(f.father.name, 'Khan');
  assert.equal(f.father.email, 'k@x.pk');
  assert.equal(f.mother.name, '');
  assert.equal(f.dob, '2018-03-04');
  assert.equal(f.admissionDate, '2026-10-12');
  assert.equal(f.admissionType, 'transfer');
  assert.equal(f.address.street, 'Street 1');
  assert.deepEqual(f.emergencyContact, { name: 'Khan', phone: '0300', relation: 'Father' });
  const m = admitPrefill({ ...base, guardian: { name: 'Amna', relation: 'mother' } });
  assert.equal(m.mother.name, 'Amna');
  const g = admitPrefill({ ...base, guardian: { name: 'Uncle', relation: 'guardian' } });
  assert.equal(g.guardian.name, 'Uncle');
  assert.equal(g.father.name, '');
  assert.equal(
    parentPrefillFromEnquiry({ guardian: { relation: 'x', name: 'A' } }).relation,
    'father',
  );
});

test('buildAdmitPayload', () => {
  const f = admitPrefill(
    { child: { name: 'Ali' }, guardian: { name: 'Khan', relation: 'father', phone: '0300' } },
    { today: '2026-10-12', academicYear: '2026-2027' },
  );
  const body = buildAdmitPayload(
    { ...f, classId: 'c1', sectionId: 's1', email: 'ali@x.pk', mother: { name: 'Amna' } },
    {
      allowDifferentGrade: true,
      parent: { relation: 'father', name: 'Khan', email: 'k@x.pk', password: ' pass word ' },
    },
  );
  assert.equal(body.classId, 'c1');
  assert.equal(body.academicYear, '2026-2027');
  assert.equal(body.admissionDate, '2026-10-12');
  assert.equal(body.allowDifferentGrade, true);
  assert.equal(body.student.email, 'ali@x.pk');
  assert.equal(body.student.father.name, 'Khan');
  assert.equal(body.student.guardian, undefined);
  assert.equal(body.student.previousSchool, undefined);
  assert.equal(body.createParent.password, ' pass word ');
  const plain = buildAdmitPayload({ ...f, classId: 'c1', sectionId: 's1' });
  assert.equal('allowDifferentGrade' in plain, false);
  assert.equal('createParent' in plain, false);
});

test('voucherOutcome', () => {
  assert.equal(voucherOutcome(201, { message: 'Voucher generated', data: {} }).kind, 'created');
  const s = voucherOutcome(200, {
    message: 'Voucher not generated: exists',
    data: { skipped: true },
  });
  assert.equal(s.kind, 'skipped');
  assert.match(s.message, /exists/);
});

test('forms helpers and public url', () => {
  assert.deepEqual(normalizeForms(null), []);
  assert.equal(normalizeForms({ branchId: 'b1', publicKey: 'k' }).length, 1);
  assert.equal(normalizeForms([{ branchId: 'b1' }]).length, 1);
  const forms = [{ branchId: { _id: 'b1' }, publicKey: 'abc' }, { branchId: 'b2' }];
  assert.equal(formForBranch(forms, 'b1').publicKey, 'abc');
  assert.equal(formForBranch(forms, 'b3'), null);
  assert.equal(
    publicApplyUrl('http://localhost:3003/', { publicKey: 'abc' }),
    'http://localhost:3003/apply/abc',
  );
  assert.equal(
    publicApplyUrl('https://p.x', { publicUrlPath: '/apply/zzz', publicKey: 'abc' }),
    'https://p.x/apply/zzz',
  );
  assert.equal(publicApplyUrl('x', {}), '');
  assert.equal(sumCounts({ a: 2, b: '3', c: null }), 5);
});
