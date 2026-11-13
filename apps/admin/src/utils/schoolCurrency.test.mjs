// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_SCHOOL_CURRENCY,
  SCHOOL_CURRENCIES,
  currencyFromSettings,
  currencySymbolOf,
  isSchoolCurrency,
  schoolCurrency,
  schoolCurrencySymbol,
  setSchoolCurrency,
} from './schoolCurrency.js';

test('the list holds the 13 currencies the API accepts, PKR first', () => {
  assert.equal(SCHOOL_CURRENCIES.length, 13);
  assert.deepEqual(SCHOOL_CURRENCIES[0], { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' });
  const codes = SCHOOL_CURRENCIES.map((c) => c.code);
  assert.equal(new Set(codes).size, 13);
  for (const c of [
    'INR',
    'BDT',
    'AFN',
    'AED',
    'SAR',
    'QAR',
    'OMR',
    'KWD',
    'BHD',
    'USD',
    'GBP',
    'EUR',
  ]) {
    assert.ok(codes.includes(c), c);
  }
});

test('the default is PKR / Rs', () => {
  assert.deepEqual({ ...DEFAULT_SCHOOL_CURRENCY }, { code: 'PKR', symbol: 'Rs' });
});

test('isSchoolCurrency accepts listed codes, any case', () => {
  assert.equal(isSchoolCurrency('AED'), true);
  assert.equal(isSchoolCurrency('usd'), true);
  assert.equal(isSchoolCurrency('JPY'), false);
  assert.equal(isSchoolCurrency(''), false);
  assert.equal(isSchoolCurrency(null), false);
});

test('currencySymbolOf maps codes to symbols, unknown codes to themselves', () => {
  assert.equal(currencySymbolOf('PKR'), 'Rs');
  assert.equal(currencySymbolOf('inr'), '₹');
  assert.equal(currencySymbolOf('GBP'), '£');
  assert.equal(currencySymbolOf('JPY'), 'JPY');
  assert.equal(currencySymbolOf(undefined), 'Rs');
});

test('currencyFromSettings prefers the server symbol', () => {
  assert.deepEqual(currencyFromSettings({ currency: 'AED', currencySymbol: 'AED' }), {
    code: 'AED',
    symbol: 'AED',
  });
  assert.deepEqual(currencyFromSettings({ currency: 'USD', currencySymbol: 'US$' }), {
    code: 'USD',
    symbol: 'US$',
  });
});

test('currencyFromSettings fills a missing symbol from the list', () => {
  assert.deepEqual(currencyFromSettings({ currency: 'eur' }), { code: 'EUR', symbol: '€' });
  assert.deepEqual(currencyFromSettings({ currency: 'INR', currencySymbol: '  ' }), {
    code: 'INR',
    symbol: '₹',
  });
});

test('currencyFromSettings falls back to PKR / Rs without a currency', () => {
  for (const s of [undefined, null, {}, { currency: '' }, { currency: 5 }]) {
    assert.deepEqual(currencyFromSettings(s), { code: 'PKR', symbol: 'Rs' });
  }
});

test('setSchoolCurrency records the currency in force; falsy resets', () => {
  setSchoolCurrency({ code: 'GBP', symbol: '£' });
  assert.deepEqual(schoolCurrency(), { code: 'GBP', symbol: '£' });
  assert.equal(schoolCurrencySymbol(), '£');
  setSchoolCurrency({ code: 'INR' });
  assert.equal(schoolCurrencySymbol(), '₹');
  setSchoolCurrency(null);
  assert.deepEqual(schoolCurrency(), { code: 'PKR', symbol: 'Rs' });
});
