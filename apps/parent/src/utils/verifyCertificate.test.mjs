// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeCode,
  isValidCode,
  certificateTypeLabel,
  formatIssueDate,
  verifyErrorState,
} from "./verifyCertificate.js";

test("normalizeCode uppercases and strips spaces/dashes", () => {
  assert.equal(normalizeCode(" abcd-efgh 23 "), "ABCDEFGH23");
  assert.equal(normalizeCode("ABCDE%20FGH23"), "ABCDEFGH23");
  assert.equal(normalizeCode("%E0%A4%A"), "%E0%A4%A");
  assert.equal(normalizeCode(undefined), "");
  assert.equal(normalizeCode(null), "");
});

test("isValidCode requires exactly 10 A-Z0-9 chars", () => {
  assert.equal(isValidCode("ABCDEFGH23"), true);
  assert.equal(isValidCode("ABCDEFGH2"), false);
  assert.equal(isValidCode("ABCDEFGH234"), false);
  assert.equal(isValidCode("abcdefgh23"), false);
  assert.equal(isValidCode("ABCDE#GH23"), false);
  assert.equal(isValidCode(""), false);
  assert.equal(isValidCode(undefined), false);
});

test("certificateTypeLabel", () => {
  assert.match(certificateTypeLabel("slc"), /School Leaving \/ Transfer/);
  assert.match(certificateTypeLabel("character"), /Character/);
  assert.match(certificateTypeLabel("bonafide"), /Bonafide/);
  assert.match(certificateTypeLabel("fee-clearance"), /Fee Clearance/);
  assert.equal(certificateTypeLabel("x"), "Certificate");
});

test("formatIssueDate → dd-MM-yyyy", () => {
  assert.equal(formatIssueDate("2026-03-07"), "07-03-2026");
  assert.equal(
    formatIssueDate(new Date(2026, 0, 5).toISOString()),
    "05-01-2026",
  );
  assert.equal(formatIssueDate(""), "");
  assert.equal(formatIssueDate("nope"), "");
});

test("verifyErrorState", () => {
  assert.equal(verifyErrorState({ response: { status: 404 } }), "notfound");
  assert.equal(verifyErrorState({ response: { status: 429 } }), "ratelimited");
  assert.equal(verifyErrorState({ response: { status: 500 } }), "error");
  assert.equal(verifyErrorState(new Error("net")), "error");
});
