// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAN_FEATURE_KEYS,
  PLAN_MODULE_GROUPS,
  enabledPlanFeatures,
  checkedModulesFor,
  featuresPayload,
} from './planFeatures.js';

test('every module is in exactly one form group', () => {
  const grouped = PLAN_MODULE_GROUPS.flatMap((g) => g.keys);
  assert.equal(grouped.length, PLAN_FEATURE_KEYS.length);
  assert.deepEqual([...grouped].sort(), [...PLAN_FEATURE_KEYS].sort());
});

test('empty, missing or legacy free-text lists open every module', () => {
  assert.equal(enabledPlanFeatures([]), null);
  assert.equal(enabledPlanFeatures(undefined), null);
  assert.equal(enabledPlanFeatures(null), null);
  assert.equal(enabledPlanFeatures(['Unlimited SMS', 'Priority support']), null);
});

test('a gating list opens only the named modules, in catalogue order', () => {
  assert.deepEqual(enabledPlanFeatures(['core']), []);
  assert.deepEqual(enabledPlanFeatures(['core', 'whatsapp', 'library']), ['library', 'whatsapp']);
  // A known key without `core` is still a gating list.
  assert.deepEqual(enabledPlanFeatures(['transport', 'legacy text']), ['transport']);
});

test('checkedModulesFor pre-ticks everything for a legacy list', () => {
  assert.deepEqual(checkedModulesFor([]), PLAN_FEATURE_KEYS);
  assert.deepEqual(checkedModulesFor(['old free text']), PLAN_FEATURE_KEYS);
  assert.deepEqual(checkedModulesFor(['core']), []);
  assert.deepEqual(checkedModulesFor(['core', 'leave']), ['leave']);
});

test('featuresPayload always sends core, drops unknown keys and duplicates', () => {
  assert.deepEqual(featuresPayload([]), ['core']);
  assert.deepEqual(featuresPayload(undefined), ['core']);
  assert.deepEqual(featuresPayload(['whatsapp', 'library', 'library', 'bogus']), [
    'core',
    'library',
    'whatsapp',
  ]);
});
