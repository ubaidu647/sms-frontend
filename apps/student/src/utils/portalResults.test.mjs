// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  resultsPendingBadge,
  resultsPendingMessage,
  resultsHidden,
  displayStatus,
  isVoidVoucher,
  pageCount,
  RESULTS_PENDING_MESSAGE,
  VOID_VOUCHER_LABEL,
} from "./portalResults.js";

test("MCQ results are hidden only when the server says so", () => {
  assert.equal(
    resultsHidden({ submissionType: "mcq", resultsReleased: false }),
    true,
  );
  assert.equal(
    resultsHidden({ submissionType: "mcq", resultsReleased: true }),
    false,
  );
  // an older server sends no flag
  assert.equal(resultsHidden({ submissionType: "mcq" }), false);
  assert.equal(
    resultsHidden({ submissionType: "written", resultsReleased: false }),
    false,
  );
  assert.equal(resultsHidden(null), false);
  assert.match(RESULTS_PENDING_MESSAGE, /after the due date/);
});

test('an auto-graded MCQ reads "submitted" until its results are out', () => {
  const hw = {
    submissionType: "mcq",
    submissionStatus: "graded",
    resultsReleased: false,
  };
  assert.equal(displayStatus(hw), "submitted");
  assert.equal(displayStatus({ ...hw, resultsReleased: true }), "graded");
  assert.equal(
    displayStatus({ submissionType: "written", submissionStatus: "late" }),
    "late",
  );
  assert.equal(displayStatus({}), "pending");
});

test("void vouchers are recognised either way the server marks them", () => {
  assert.equal(isVoidVoucher({ status: "void", balanceAmount: 1000 }), true);
  assert.equal(isVoidVoucher({ status: "unpaid", isVoid: true }), true);
  assert.equal(isVoidVoucher({ status: "unpaid" }), false);
  assert.equal(isVoidVoucher(undefined), false);
  assert.match(VOID_VOUCHER_LABEL, /Cancelled/);
});

test("page count for the fee list", () => {
  assert.equal(pageCount(26, 24), 2);
  assert.equal(pageCount(24, 24), 1);
  assert.equal(pageCount(0, 24), 1);
  assert.equal(pageCount(undefined, 24), 1);
});

test("results wait for the teacher when late work is allowed", () => {
  assert.equal(
    resultsPendingMessage({ allowLateSubmission: true }),
    "Results will be shown when your teacher closes this homework.",
  );
  assert.equal(
    resultsPendingMessage({ allowLateSubmission: false }),
    "Results will be shown after the due date.",
  );
  assert.equal(
    resultsPendingBadge({ allowLateSubmission: true }),
    "Results when closed",
  );
  assert.equal(resultsPendingBadge({}), "Results after the due date");
});
