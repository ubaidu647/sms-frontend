// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SEAT_REFUSAL_FALLBACK,
  retryUnlessRefused,
  seatRefusalMessage,
} from "./seatRefusal.js";

const http = (status, data) => ({ response: { status, data } });

test("seatRefusalMessage: a 403 shows the server's message", () => {
  const err = http(403, { message: " You have graduated. " });
  assert.equal(seatRefusalMessage(err), "You have graduated.");
});

test("seatRefusalMessage: a code does not change the reading", () => {
  const err = http(403, { message: "You have left.", code: "NO_SEAT" });
  assert.equal(seatRefusalMessage(err), "You have left.");
});

test("seatRefusalMessage: a 403 with no usable message has a fallback", () => {
  for (const data of [undefined, "", {}, { message: "  " }, { message: 7 }]) {
    assert.equal(seatRefusalMessage(http(403, data)), SEAT_REFUSAL_FALLBACK);
  }
});

test("seatRefusalMessage: other failures stay errors", () => {
  assert.equal(seatRefusalMessage(http(500, { message: "Boom" })), null);
  assert.equal(seatRefusalMessage(http(404, { message: "Gone" })), null);
  assert.equal(seatRefusalMessage(new Error("Network Error")), null);
  assert.equal(seatRefusalMessage(null), null);
});

test("seatRefusalMessage: session-level 403s are left to the API client", () => {
  const plan = http(403, { message: "x", code: "PLAN_DASHBOARD_DISABLED" });
  const password = http(403, { message: "x", code: "PASSWORD_CHANGE_REQUIRED" });
  assert.equal(seatRefusalMessage(plan), null);
  assert.equal(seatRefusalMessage(password), null);
});

test("retryUnlessRefused: a 403 is never retried", () => {
  assert.equal(retryUnlessRefused(0, http(403, {})), false);
});

test("retryUnlessRefused: anything else keeps three retries", () => {
  assert.equal(retryUnlessRefused(0, http(500, {})), true);
  assert.equal(retryUnlessRefused(2, new Error("Network Error")), true);
  assert.equal(retryUnlessRefused(3, http(500, {})), false);
});
