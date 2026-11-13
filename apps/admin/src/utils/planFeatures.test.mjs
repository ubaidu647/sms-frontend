// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  actionsInPlan,
  featureForMenu,
  featureForPath,
  gateState,
  isActionInPlan,
  isFeatureEnabled,
  lockedModuleDisplayOf,
  menusInPlan,
  normalizeFeatures,
  outOfPlanGrants,
  withPreservedGrants,
} from './planFeatures.js';

test('null features means every module is open', () => {
  assert.equal(isFeatureEnabled(null, 'library'), true);
  assert.equal(isFeatureEnabled(undefined, 'accounting'), true);
});

test('a features list opens only the modules it names', () => {
  assert.equal(isFeatureEnabled(['library'], 'library'), true);
  assert.equal(isFeatureEnabled(['library'], 'accounting'), false);
  assert.equal(isFeatureEnabled([], 'whatsapp'), false);
});

test('core keys (or no key) are always open', () => {
  assert.equal(isFeatureEnabled([], 'fees'), true);
  assert.equal(isFeatureEnabled([], null), true);
});

test('normalizeFeatures keeps known keys and maps a missing list to null', () => {
  assert.equal(normalizeFeatures(undefined), null);
  assert.equal(normalizeFeatures('library'), null);
  assert.deepEqual(normalizeFeatures(['core', 'library', 'nope']), ['library']);
});

test('menu keys map to their module', () => {
  assert.equal(featureForMenu('my-leave'), 'leave');
  assert.equal(featureForMenu('payslip'), 'staff-salary');
  assert.equal(featureForMenu('financial-report'), 'accounting');
  assert.equal(featureForMenu('transport-assignment'), 'transport');
  assert.equal(featureForMenu('fee'), null);
  assert.equal(featureForMenu('attendance'), null);
});

test('paths map to their module on a segment boundary', () => {
  assert.equal(featureForPath('/dashboard/school/library'), 'library');
  assert.equal(featureForPath('/dashboard/school/library/books/1'), 'library');
  assert.equal(featureForPath('/dashboard/school/accounting/reports/trial-balance'), 'accounting');
  assert.equal(featureForPath('/dashboard/school/my-leave/'), 'leave');
  assert.equal(featureForPath('/dashboard/business-settings/whatsapp?tab=x'), 'whatsapp');
  assert.equal(featureForPath('/dashboard/school/staff-attendance'), 'staff-attendance');
  // core screens and look-alike prefixes are not gated
  assert.equal(featureForPath('/dashboard/school/attendance'), null);
  assert.equal(featureForPath('/dashboard/school/leaves'), null);
  assert.equal(featureForPath('/dashboard/school/fees/payments'), null);
  assert.equal(featureForPath(''), null);
});

test('gateState honours the display setting', () => {
  assert.equal(gateState(['library'], 'library', 'hide'), 'show');
  assert.equal(gateState([], 'library', 'lock'), 'lock');
  assert.equal(gateState([], 'library', 'hide'), 'hide');
  assert.equal(gateState([], null, 'hide'), 'show');
  assert.equal(lockedModuleDisplayOf({ lockedModuleDisplay: 'hide' }), 'hide');
  assert.equal(lockedModuleDisplayOf({}), 'lock');
  assert.equal(lockedModuleDisplayOf(null), 'lock');
});

test('role catalogue filtering drops out-of-plan menus and actions', () => {
  const menus = [{ key: 'fee' }, { key: 'account' }, { key: 'library' }];
  assert.deepEqual(
    menusInPlan(menus, ['library']).map((m) => m.key),
    ['fee', 'library'],
  );
  const actions = [
    { key: 'view-fee', menu: 'fee' },
    { key: 'view-account', menu: 'account' },
  ];
  assert.deepEqual(
    actionsInPlan(actions, []).map((a) => a.key),
    ['view-fee'],
  );
  assert.equal(menusInPlan(menus, null).length, 3);
  assert.equal(isActionInPlan('view-journal', []), false);
  assert.equal(isActionInPlan('view-fee', []), true);
  assert.equal(isActionInPlan('some-unknown-action', []), true);
});

test('editing a role keeps grants of modules outside the plan', () => {
  const role = {
    menus: ['fee', 'library', 'account'],
    actions: ['view-fee', 'view-library', 'view-account', 'view-own-library'],
  };
  const features = ['library'];
  assert.deepEqual(outOfPlanGrants(role, features), {
    menus: ['account'],
    actions: ['view-account'],
  });
  // the form (which never showed `account`) dropped the fee menu
  const saved = withPreservedGrants(
    { name: 'Clerk', menus: ['library'], actions: ['view-library'] },
    role,
    features,
  );
  assert.equal(saved.name, 'Clerk');
  assert.deepEqual(saved.menus, ['library', 'account']);
  assert.deepEqual(saved.actions, ['view-library', 'view-account']);
  // all modules open → nothing extra to keep
  assert.deepEqual(outOfPlanGrants(role, null), { menus: [], actions: [] });
});
