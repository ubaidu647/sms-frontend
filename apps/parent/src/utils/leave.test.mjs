// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  localYMD,
  isValidYMD,
  addDaysYMD,
  spanDays,
  validateLeaveForm,
  canParentCancel,
} from "./leave.js";

test("localYMD uses local date parts, zero-padded", () => {
  assert.equal(localYMD(new Date(2026, 0, 5, 0, 30)), "2026-01-05");
  assert.equal(localYMD(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
});

test("isValidYMD rejects impossible and malformed dates", () => {
  assert.equal(isValidYMD("2026-02-28"), true);
  assert.equal(isValidYMD("2028-02-29"), true);
  assert.equal(isValidYMD("2026-02-29"), false);
  assert.equal(isValidYMD("2026-13-01"), false);
  assert.equal(isValidYMD("2026-1-01"), false);
  assert.equal(isValidYMD(""), false);
  assert.equal(isValidYMD(undefined), false);
});

test("addDaysYMD / spanDays are inclusive calendar math", () => {
  assert.equal(addDaysYMD("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysYMD("2026-03-01", -1), "2026-02-28");
  assert.equal(spanDays("2026-10-09", "2026-10-09"), 1);
  assert.equal(spanDays("2026-10-09", "2026-10-12"), 4);
  assert.equal(spanDays("2026-10-10", "2026-10-09"), 0);
  assert.equal(spanDays("bad", "2026-10-09"), null);
});

const ok = {
  leaveType: "sick",
  fromDate: "2026-10-09",
  toDate: "2026-10-10",
  reason: "Fever",
};

test("validateLeaveForm accepts a valid form", () => {
  assert.deepEqual(validateLeaveForm(ok), {});
});

test("validateLeaveForm checks type, dates, order, span and reason", () => {
  assert.ok(validateLeaveForm({ ...ok, leaveType: "annual" }).leaveType);
  assert.ok(validateLeaveForm({ ...ok, fromDate: "" }).fromDate);
  assert.ok(validateLeaveForm({ ...ok, toDate: "2026-02-30" }).toDate);
  assert.match(
    validateLeaveForm({ ...ok, toDate: "2026-10-08" }).toDate,
    /before/,
  );
  // 60 inclusive days is fine, 61 is not.
  assert.deepEqual(
    validateLeaveForm({ ...ok, toDate: addDaysYMD(ok.fromDate, 59) }),
    {},
  );
  assert.match(
    validateLeaveForm({ ...ok, toDate: addDaysYMD(ok.fromDate, 60) }).toDate,
    /60 days/,
  );
  assert.ok(validateLeaveForm({ ...ok, reason: "  ab  " }).reason);
  assert.ok(validateLeaveForm({ ...ok, reason: "x".repeat(501) }).reason);
  assert.deepEqual(validateLeaveForm({ ...ok, reason: "x".repeat(500) }), {});
});

test("canParentCancel: pending + parent-created only", () => {
  assert.equal(
    canParentCancel({ status: "pending", requestedBy: { role: "parent" } }),
    true,
  );
  assert.equal(
    canParentCancel({ status: "pending", requestedBy: { role: "staff" } }),
    false,
  );
  assert.equal(
    canParentCancel({ status: "approved", requestedBy: { role: "parent" } }),
    false,
  );
  assert.equal(canParentCancel(null), false);
});
