import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addonLabel,
  addonTotals,
  effectiveLimit,
  addonPricesToForm,
  addonPricesFromForm,
  pricedAddons,
  planInvoiceFor,
  invoicesForSubscription,
  invoicesById,
  canRemoveAddon,
  addonRequest,
} from './addons.js';

test('addonLabel uses singular and plural units', () => {
  assert.equal(addonLabel('noOfStudents', 100), '+100 students');
  assert.equal(addonLabel('noOfBranches', 1), '+1 branch');
  assert.equal(addonLabel('noOfStaffs', 5), '+5 staff');
});

test('effective limit adds add-on units to the base limit', () => {
  const sub = {
    computedLimits: { noOfStudents: 300, noOfBranches: 2 },
    customLimits: { noOfBranches: 3 },
    addonLimits: { noOfStudents: 100, noOfBranches: 1 },
  };
  assert.equal(effectiveLimit(sub, 'noOfStudents'), 400);
  assert.equal(effectiveLimit(sub, 'noOfBranches'), 4);
  assert.equal(effectiveLimit(sub, 'noOfSections'), null);
});

test('without addonLimits, add-on units are summed from the stored add-ons', () => {
  const sub = {
    computedLimits: { noOfStudents: 300 },
    addons: [
      { resource: 'noOfStudents', quantity: 100 },
      { resource: 'noOfStudents', quantity: 50 },
    ],
  };
  assert.deepEqual(addonTotals(sub), { noOfStudents: 150 });
  assert.equal(effectiveLimit(sub, 'noOfStudents'), 450);
  assert.equal(effectiveLimit({ computedLimits: { noOfStudents: 300 } }, 'noOfStudents'), 300);
});

test('add-on prices round-trip through the form; blank is null', () => {
  const form = addonPricesToForm({ addonPrices: { noOfStudents: 10, noOfBranches: null } });
  assert.equal(form.addon_noOfStudents, '10');
  assert.equal(form.addon_noOfBranches, '');
  assert.deepEqual(addonPricesFromForm({ ...form, addon_noOfSections: '0' }), {
    noOfStudents: 10,
    noOfBranches: null,
    noOfStaffs: null,
    noOfSections: 0,
    storageGB: null,
  });
  assert.deepEqual(addonPricesToForm(null).addon_noOfStaffs, '');
});

test('pricedAddons lists only priced entries, zero included', () => {
  assert.deepEqual(pricedAddons({ noOfStudents: 10, noOfBranches: null, noOfSections: 0 }), [
    { key: 'noOfStudents', price: 10 },
    { key: 'noOfSections', price: 0 },
  ]);
  assert.deepEqual(pricedAddons(undefined), []);
});

const invoices = [
  { _id: 'i3', subscriptionId: 's1', type: 'addon', status: 'unpaid', createdAt: '2026-01-03' },
  { _id: 'i2', subscriptionId: 's1', type: 'renewal', status: 'paid', createdAt: '2026-01-02' },
  { _id: 'i1', subscriptionId: 's0', type: 'new', status: 'paid', createdAt: '2026-01-01' },
];

test('the plan invoice skips add-on bills', () => {
  assert.equal(planInvoiceFor(invoices, 's1')._id, 'i2');
  assert.equal(planInvoiceFor(invoices, { _id: 's0' })._id, 'i1');
  assert.equal(planInvoiceFor(invoices, 's9'), null);
  assert.deepEqual(
    invoicesForSubscription(invoices, 's1').map((i) => i._id),
    ['i3', 'i2'],
  );
});

test('only an add-on on its own unpaid add-on invoice can be removed', () => {
  const byId = invoicesById(invoices);
  assert.equal(canRemoveAddon({ invoiceId: 'i3' }, byId), true);
  assert.equal(canRemoveAddon({ invoiceId: 'i2' }, byId), false);
  assert.equal(canRemoveAddon({ invoiceId: 'nope' }, byId), false);
  assert.equal(canRemoveAddon({ invoiceId: 'i3' }, undefined), false);
});

test('addonRequest validates and sends unitPrice only when it differs', () => {
  const base = { schoolId: 'x', resource: 'noOfStudents', quantity: '100', defaultUnitPrice: 10 };
  assert.deepEqual(addonRequest({ ...base, unitPrice: '10' }).body, {
    schoolId: 'x',
    resource: 'noOfStudents',
    quantity: 100,
  });
  assert.equal(addonRequest({ ...base, unitPrice: '12' }).body.unitPrice, 12);
  assert.equal(addonRequest({ ...base, unitPrice: '' }).body.unitPrice, undefined);
  assert.match(addonRequest({ ...base, defaultUnitPrice: null, unitPrice: '' }).error, /price/);
  assert.equal(addonRequest({ ...base, defaultUnitPrice: null, unitPrice: '0' }).body.unitPrice, 0);
  assert.match(addonRequest({ ...base, quantity: '0' }).error, /Quantity/);
  assert.match(addonRequest({ ...base, quantity: '1.5' }).error, /Quantity/);
  assert.match(addonRequest({ ...base, unitPrice: '-1' }).error, /Unit price/);
  assert.match(addonRequest({ ...base, resource: 'x' }).error, /Choose/);
});

/* ------------------- storage and module add-ons ------------------- */

import {
  addonText,
  addonPriceLabel,
  modulePricesToForm,
  modulePricesFromForm,
  pricedModules,
  addonModulesOf,
  COUNT_RESOURCES,
} from './addons.js';

test('module add-ons are labelled by name; storage by GB', () => {
  assert.equal(addonLabel('module', 1, 'whatsapp'), 'WhatsApp module');
  assert.equal(
    addonText({ resource: 'module', module: 'staff-salary', quantity: 1 }),
    'Staff salary module',
  );
  assert.equal(addonLabel('storageGB', 5), '+5 GB of storage');
  assert.equal(addonPriceLabel('storageGB'), 'Extra GB');
  assert.equal(addonPriceLabel('noOfStudents'), 'Students');
  assert.ok(!COUNT_RESOURCES.some(([k]) => k === 'storageGB'));
});

test('module add-ons do not count towards limit totals', () => {
  const sub = {
    computedLimits: { noOfStudents: 300 },
    addons: [
      { resource: 'module', module: 'whatsapp', quantity: 1 },
      { resource: 'storageGB', quantity: 2 },
    ],
  };
  assert.deepEqual(addonTotals(sub), { storageGB: 2 });
  assert.deepEqual(addonModulesOf(sub), ['whatsapp']);
  assert.deepEqual(addonModulesOf({ addonModules: ['library'] }), ['library']);
});

test('module prices round-trip; blank and plan-included modules are null', () => {
  const form = modulePricesToForm({ moduleAddonPrices: { whatsapp: 1000, library: null } });
  assert.equal(form.modaddon_whatsapp, '1000');
  assert.equal(form.modaddon_library, '');
  const out = modulePricesFromForm(
    { ...form, modaddon_transport: '500', modaddon_accounting: '0' },
    ['transport'],
  );
  assert.equal(out.whatsapp, 1000);
  assert.equal(out.transport, null);
  assert.equal(out.accounting, 0);
  assert.equal(out.library, null);
  assert.equal(Object.keys(out).length, 10);
  assert.deepEqual(pricedModules(out), [
    { key: 'accounting', price: 0 },
    { key: 'whatsapp', price: 1000 },
  ]);
});

test('a module add-on request sends no quantity', () => {
  assert.deepEqual(
    addonRequest({ schoolId: 's', resource: 'module', module: 'whatsapp', defaultUnitPrice: 1000 }),
    { body: { schoolId: 's', resource: 'module', module: 'whatsapp' } },
  );
  assert.deepEqual(
    addonRequest({
      schoolId: 's',
      resource: 'module',
      module: 'whatsapp',
      unitPrice: '800',
      defaultUnitPrice: 1000,
    }).body,
    { schoolId: 's', resource: 'module', module: 'whatsapp', unitPrice: 800 },
  );
  assert.ok(addonRequest({ schoolId: 's', resource: 'module', module: '' }).error);
  assert.ok(
    addonRequest({ schoolId: 's', resource: 'module', module: 'whatsapp', defaultUnitPrice: null })
      .error,
  );
  assert.deepEqual(
    addonRequest({ schoolId: 's', resource: 'storageGB', quantity: '3', defaultUnitPrice: 50 })
      .body,
    { schoolId: 's', resource: 'storageGB', quantity: 3 },
  );
});
