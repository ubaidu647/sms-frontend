// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { anyHasSalaryField, hasSalaryField } from './staffSalary.js';

test('hasSalaryField: a zero or a null is present, a missing field is not', () => {
  assert.equal(hasSalaryField({ salary: 35000 }), true);
  assert.equal(hasSalaryField({ salary: 0 }), true);
  assert.equal(hasSalaryField({ salary: null }), true);
  assert.equal(hasSalaryField({ name: 'A' }), false);
  assert.equal(hasSalaryField(undefined), false);
});

test('anyHasSalaryField: one row with the field is enough', () => {
  assert.equal(anyHasSalaryField([{ name: 'A' }, { salary: 1 }]), true);
  assert.equal(anyHasSalaryField([{ name: 'A' }]), false);
  assert.equal(anyHasSalaryField([]), false);
  assert.equal(anyHasSalaryField(undefined), false);
});
