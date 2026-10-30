// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizePhone,
  isValidPkPhone,
  isValidEmail,
  cleanText,
  cleanMultiline,
  validateApplyForm,
  buildApplyPayload,
  toFillMs,
  MAX_FILL_MS,
  elapsedMs,
  applyResult,
  applyErrorMessage,
  EMPTY_FORM,
  NOTES_MAX,
  ADDRESS_MAX,
} from "./applyForm.js";

const grades = [
  { value: "kg-1", label: "KG-1" },
  { value: "5", label: "Class 5" },
];

const valid = {
  ...EMPTY_FORM,
  childName: "  Ali   Khan ",
  desiredGrade: "5",
  guardianName: "Imran Khan",
  relation: "father",
  phone: "0300-1234567",
};

test("normalizePhone strips separators and converts 00 prefix", () => {
  assert.equal(normalizePhone("0300-1234567"), "03001234567");
  assert.equal(normalizePhone("+92 300 123 4567"), "+923001234567");
  assert.equal(normalizePhone("(0300) 123.4567"), "03001234567");
  assert.equal(normalizePhone("0092 300 1234567"), "+923001234567");
  assert.equal(normalizePhone(undefined), "");
});

test("isValidPkPhone accepts PK mobile / landline formats", () => {
  for (const ok of [
    "03001234567",
    "0300-1234567",
    "+92 300 1234567",
    "923001234567",
    "0092-300-1234567",
    "042-35761234",
    "+92 42 35761234",
  ]) {
    assert.equal(isValidPkPhone(ok), true, ok);
  }
  for (const bad of [
    "",
    "0300123456",
    "030012345678",
    "+9230012345",
    "12345",
    "abc",
    "+1 555 123 4567",
    "0300-123456a",
  ]) {
    assert.equal(isValidPkPhone(bad), false, bad);
  }
});

test("isValidEmail", () => {
  assert.equal(isValidEmail("a@b.co"), true);
  assert.equal(isValidEmail("a@b"), false);
  assert.equal(isValidEmail("a b@c.com"), false);
  assert.equal(isValidEmail(""), false);
});

test("cleanText / cleanMultiline", () => {
  assert.equal(cleanText("  a   b \n c "), "a b c");
  assert.equal(cleanMultiline("  l1  \r\n\n\n\n  l2   x "), "l1\n\nl2 x");
});

test("validateApplyForm passes a minimal valid form", () => {
  const r = validateApplyForm(valid, { grades, today: "2026-10-12" });
  assert.deepEqual(r.errors, {});
  assert.equal(r.valid, true);
});

test("validateApplyForm requires child, guardian, phone, grade", () => {
  const r = validateApplyForm(EMPTY_FORM, { grades });
  assert.equal(r.valid, false);
  for (const k of ["childName", "guardianName", "phone", "desiredGrade"]) {
    assert.ok(r.errors[k], k);
  }
  assert.equal(r.errors.email, undefined);
});

test("validateApplyForm length caps and field rules", () => {
  const r = validateApplyForm(
    {
      ...valid,
      childName: "x".repeat(101),
      guardianName: "y".repeat(101),
      notes: "n".repeat(NOTES_MAX + 1),
      address: "a".repeat(ADDRESS_MAX + 1),
      email: "nope",
      phone: "12345",
      desiredGrade: "9",
      gender: "x",
      relation: "uncle",
      dob: "2026-10-12",
    },
    { grades, today: "2026-10-12" },
  );
  for (const k of [
    "childName",
    "guardianName",
    "notes",
    "address",
    "email",
    "phone",
    "desiredGrade",
    "gender",
    "relation",
    "dob",
  ]) {
    assert.ok(r.errors[k], k);
  }
  assert.ok(
    validateApplyForm({ ...valid, dob: "2026-02-30" }, { grades }).errors.dob,
  );
  assert.equal(
    validateApplyForm({ ...valid, dob: "2019-05-01" }, { grades }).valid,
    true,
  );
});

test("buildApplyPayload trims, normalises and omits blanks", () => {
  const body = buildApplyPayload(
    { ...valid, email: " A@B.COM ", notes: "  hi  " },
    { website: "", startedAt: 1700000000000, fillMs: 12345.6 },
  );
  assert.deepEqual(body, {
    child: { name: "Ali Khan" },
    desiredGrade: "5",
    guardian: {
      name: "Imran Khan",
      relation: "father",
      phone: "03001234567",
      email: "a@b.com",
    },
    notes: "hi",
    website: "",
    startedAt: 1700000000000,
    fillMs: 12346,
  });
});

test("buildApplyPayload passes honeypot through unchanged", () => {
  const body = buildApplyPayload(valid, { website: "spam", startedAt: 1 });
  assert.equal(body.website, "spam");
  assert.equal(body.startedAt, 1);
  assert.equal(body.fillMs, 0);
});

test("toFillMs / elapsedMs never go negative or NaN", () => {
  assert.equal(toFillMs(-5), 0);
  assert.equal(toFillMs("abc"), 0);
  assert.equal(toFillMs(1500.4), 1500);
  assert.equal(elapsedMs(100, 4100.2), 4000);
  assert.equal(elapsedMs(5000, 4000), 0);
  assert.equal(elapsedMs(0, 4000), 0);
  assert.equal(elapsedMs(undefined, 4000), 0);
});

test("toFillMs clamps an overnight-open form to 24h", () => {
  assert.equal(MAX_FILL_MS, 86_400_000);
  assert.equal(toFillMs(86_400_000), 86_400_000);
  assert.equal(toFillMs(3 * 86_400_000), 86_400_000);
  assert.equal(toFillMs(Infinity), 0);
  assert.equal(elapsedMs(1, 1 + 2 * 86_400_000), 86_400_000);
});

test("applyResult prefers reference, falls back to enquiryNumber", () => {
  assert.deepEqual(
    applyResult({ reference: "ENQ-7KX3P9", message: "Thanks" }),
    {
      reference: "ENQ-7KX3P9",
      message: "Thanks",
    },
  );
  assert.deepEqual(applyResult({ enquiryNumber: "ENQ-0001" }, "Saved"), {
    reference: "ENQ-0001",
    message: "Saved",
  });
  assert.deepEqual(applyResult(null), { reference: "", message: "" });
});

test("applyErrorMessage maps statuses", () => {
  assert.match(
    applyErrorMessage({ response: { status: 429 } }),
    /Too many submissions/,
  );
  assert.equal(
    applyErrorMessage({
      response: { status: 400, data: { message: "Bad phone" } },
    }),
    "Bad phone",
  );
  assert.match(
    applyErrorMessage({ response: { status: 404 } }),
    /not available/,
  );
  assert.match(applyErrorMessage({}), /reach the server/);
  assert.match(applyErrorMessage({ response: { status: 500 } }), /went wrong/);
});

test("applyErrorMessage uses the server message for 429 and 503", () => {
  assert.equal(
    applyErrorMessage({
      response: { status: 429, data: { message: "Try again in 10 minutes" } },
    }),
    "Try again in 10 minutes",
  );
  assert.equal(
    applyErrorMessage({
      response: { status: 503, data: { message: "Admissions are paused" } },
    }),
    "Admissions are paused",
  );
  assert.match(
    applyErrorMessage({ response: { status: 503, data: { message: "  " } } }),
    /went wrong/,
  );
  assert.match(
    applyErrorMessage({ response: { status: 429, data: {} } }),
    /Too many submissions/,
  );
});
