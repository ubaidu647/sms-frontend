import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addonTotals, addonUnits, baseLimit, effectiveLimit, pricedAddons } from './planAddons.js';

test('effective limit adds add-on units to the base limit', () => {
  const sub = {
    computedLimits: { noOfStudents: 300, noOfBranches: 2 },
    customLimits: { noOfBranches: 3 },
    addonLimits: { noOfStudents: 100 },
  };
  assert.equal(effectiveLimit(sub, 'noOfStudents'), 400);
  assert.equal(baseLimit(sub, 'noOfStudents'), 300);
  assert.equal(addonUnits(sub, 'noOfStudents'), 100);
  assert.equal(effectiveLimit(sub, 'noOfBranches'), 3);
  assert.equal(addonUnits(sub, 'noOfBranches'), 0);
  assert.equal(effectiveLimit(sub, 'noOfSections'), null);
});

test('without addonLimits, units are summed from the stored add-ons', () => {
  const sub = {
    computedLimits: { noOfStudents: 300 },
    addons: [
      { resource: 'noOfStudents', quantity: 100 },
      { resource: 'noOfStudents', quantity: 20 },
    ],
  };
  assert.deepEqual(addonTotals(sub), { noOfStudents: 120 });
  assert.equal(effectiveLimit(sub, 'noOfStudents'), 420);
  assert.equal(effectiveLimit(null, 'noOfStudents'), null);
});

test('pricedAddons hides null entries and keeps a zero price', () => {
  assert.deepEqual(
    pricedAddons({ noOfStudents: 10, noOfBranches: null, noOfStaffs: 0, noOfSections: null }),
    [
      { key: 'noOfStudents', price: 10 },
      { key: 'noOfStaffs', price: 0 },
    ],
  );
  assert.deepEqual(pricedAddons({ noOfStudents: null }), []);
  assert.deepEqual(pricedAddons(undefined), []);
});

import { addonModulesOf, buyableModuleOffers, isModuleAddon, livePriceLock } from './planAddons.js';

test('module add-ons are not counted as limit units; storage is priced', () => {
  const sub = {
    addons: [
      { resource: 'module', module: 'whatsapp', quantity: 1 },
      { resource: 'storageGB', quantity: 3 },
    ],
  };
  assert.deepEqual(addonTotals(sub), { storageGB: 3 });
  assert.equal(isModuleAddon(sub.addons[0]), true);
  assert.deepEqual(addonModulesOf(sub), ['whatsapp']);
  assert.deepEqual(addonModulesOf({ addonModules: ['library'], addons: sub.addons }), ['library']);
  assert.deepEqual(pricedAddons({ storageGB: 50 }), [{ key: 'storageGB', price: 50 }]);
});

test('buyable modules carry their price, null when unlisted', () => {
  assert.deepEqual(
    buyableModuleOffers({
      buyableModules: ['library', 'whatsapp'],
      moduleAddonPrices: { whatsapp: 1000, library: null },
    }),
    [
      { key: 'library', price: null },
      { key: 'whatsapp', price: 1000 },
    ],
  );
  assert.deepEqual(buyableModuleOffers({}), []);
});

test('price lock is live only before its end date', () => {
  const now = Date.UTC(2026, 0, 1);
  const sub = { priceLock: { price: 3500, until: new Date(now + 1).toISOString() } };
  assert.deepEqual(livePriceLock(sub, now), { price: 3500, until: now + 1 });
  assert.equal(livePriceLock(sub, now + 2), null);
  assert.equal(livePriceLock({ priceLock: null }, now), null);
});
