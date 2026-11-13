// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_SCHOOL_CURRENCY, currencyFromSettings } from "./currency.js";
import { formatMoney } from "./format.js";

test("the default is PKR / Rs", () => {
  assert.deepEqual({ ...DEFAULT_SCHOOL_CURRENCY }, { code: "PKR", symbol: "Rs" });
});

test("currencyFromSettings prefers the server symbol", () => {
  assert.deepEqual(currencyFromSettings({ currency: "AED", currencySymbol: "AED" }), {
    code: "AED",
    symbol: "AED",
  });
  assert.deepEqual(currencyFromSettings({ currency: "usd", currencySymbol: "US$" }), {
    code: "USD",
    symbol: "US$",
  });
});

test("currencyFromSettings fills a missing symbol", () => {
  assert.deepEqual(currencyFromSettings({ currency: "INR" }), { code: "INR", symbol: "₹" });
  assert.deepEqual(currencyFromSettings({ currency: "GBP", currencySymbol: " " }), {
    code: "GBP",
    symbol: "£",
  });
  assert.deepEqual(currencyFromSettings({ currency: "JPY" }), { code: "JPY", symbol: "JPY" });
});

test("currencyFromSettings falls back to PKR / Rs", () => {
  for (const s of [undefined, null, {}, { currency: "" }, { currency: 7 }]) {
    assert.deepEqual(currencyFromSettings(s), { code: "PKR", symbol: "Rs" });
  }
});

test("formatMoney puts the symbol in front", () => {
  assert.equal(formatMoney(10, "Rs"), "Rs 10");
  assert.equal(formatMoney(0, "€"), "€ 0");
  assert.equal(formatMoney(1234.567, "AED").replace(/[^\dA-Z. ]/g, ""), "AED 1234.57");
});

test("formatMoney without a symbol is the bare amount", () => {
  assert.equal(formatMoney(10), "10");
  assert.equal(formatMoney(null, ""), "0");
});
