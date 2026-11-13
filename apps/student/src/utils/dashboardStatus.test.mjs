// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import { amountDueStatus } from "./dashboardStatus.js";

test("amountDueStatus: a failed request never reads as cleared", () => {
  const s = amountDueStatus({ isError: true, outstanding: undefined });
  assert.deepEqual(s, { known: false, label: "Could not load", tone: "muted" });
});

test("amountDueStatus: the error wins over a retained balance", () => {
  assert.equal(amountDueStatus({ isError: true, outstanding: 0 }).known, false);
  assert.equal(amountDueStatus({ isError: true, outstanding: 500 }).known, false);
});

test("amountDueStatus: no balance yet claims nothing", () => {
  for (const outstanding of [undefined, null]) {
    assert.deepEqual(amountDueStatus({ isError: false, outstanding }), {
      known: false,
      label: "",
      tone: "muted",
    });
  }
});

test("amountDueStatus: only a real zero is cleared", () => {
  assert.equal(amountDueStatus({ outstanding: 0 }).label, "All cleared");
  assert.equal(amountDueStatus({ outstanding: 1 }).label, "Outstanding balance");
});
