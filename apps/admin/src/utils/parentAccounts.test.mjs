// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  defaultRelation,
  hasPrefill,
  otherChildren,
  parentCreateOutcome,
  parentPermissions,
  parentPrefill,
} from './parentAccounts.js';

const student = {
  father: { name: ' Ali Khan ', phone: '03001234567', email: 'ali@example.com', cnic: '1' },
  mother: { name: 'Sara Khan', phone: '' },
  guardian: { name: 'Umar', relation: 'uncle', phone: '0321' },
};

test('prefills name, phone and email from the matching embedded record', () => {
  assert.deepEqual(parentPrefill(student, 'father'), {
    name: 'Ali Khan',
    phone: '03001234567',
    email: 'ali@example.com',
  });
  assert.deepEqual(parentPrefill(student, 'mother'), { name: 'Sara Khan', phone: '', email: '' });
  assert.deepEqual(parentPrefill(student, 'guardian'), { name: 'Umar', phone: '0321', email: '' });
});

test('"other" and unknown relations never prefill', () => {
  const empty = { name: '', phone: '', email: '' };
  assert.deepEqual(parentPrefill(student, 'other'), empty);
  assert.deepEqual(parentPrefill(student, 'cnic'), empty);
  assert.deepEqual(parentPrefill(null, 'father'), empty);
  assert.equal(hasPrefill(student, 'other'), false);
});

test('default relation is the first one with data', () => {
  assert.equal(defaultRelation(student), 'father');
  assert.equal(defaultRelation({ mother: { name: 'M' } }), 'mother');
  assert.equal(defaultRelation({}), 'father');
});

test('other children leave out the current student', () => {
  const parent = {
    children: [
      { _id: 's1', name: 'A' },
      { _id: 's2', name: 'B' },
    ],
  };
  assert.deepEqual(otherChildren(parent, 's1'), [{ _id: 's2', name: 'B' }]);
  assert.deepEqual(otherChildren({}, 's1'), []);
});

test('201 means created, anything else successful means linked', () => {
  assert.equal(parentCreateOutcome(201), 'created');
  assert.equal(parentCreateOutcome(200), 'linked');
});

test('permissions follow the student actions and the student branch', () => {
  const branchRole = { actions: ['view-student', 'update-student'] };
  assert.deepEqual(parentPermissions(branchRole, 'b1', { _id: 'b1' }), {
    canView: true,
    canManage: true,
    canToggle: false,
  });
  assert.equal(parentPermissions(branchRole, 'b1', { _id: 'b2' }).canManage, false);

  const orgRole = {
    actions: ['view-all-branch-student', 'update-all-branch-student', 'delete-all-branch-student'],
  };
  assert.deepEqual(parentPermissions(orgRole, 'b1', 'b2'), {
    canView: true,
    canManage: true,
    canToggle: true,
  });

  assert.deepEqual(parentPermissions({ isPredefined: true }, '', 'b9'), {
    canView: true,
    canManage: true,
    canToggle: true,
  });
  assert.equal(parentPermissions({ actions: [] }, 'b1', 'b1').canView, false);
});
