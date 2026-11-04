// Read-side rules the portal shares between its list and detail pages.

// MCQ results — which answers were right, and the score — are withheld by the
// server until the homework is over (the due day has ended, or it is closed).
// Until then a row carries `resultsReleased: false` and the submission has the
// picks only. Older servers send no flag: treat that as released.
export const RESULTS_PENDING_MESSAGE =
  "Results will be shown after the due date.";

// Homework that takes late work stays open past its due date, so its results
// wait for the teacher to close it.
export const RESULTS_PENDING_ON_CLOSE_MESSAGE =
  "Results will be shown when your teacher closes this homework.";

export function resultsPendingMessage(hw) {
  return hw?.allowLateSubmission
    ? RESULTS_PENDING_ON_CLOSE_MESSAGE
    : RESULTS_PENDING_MESSAGE;
}

export function resultsPendingBadge(hw) {
  return hw?.allowLateSubmission
    ? "Results when closed"
    : "Results after the due date";
}

export function resultsHidden(hw) {
  return !!hw && hw.submissionType === "mcq" && hw.resultsReleased === false;
}

// The badge to show. An MCQ is auto-graded the moment it is submitted, but
// until its results are out it reads "Submitted", not "Graded".
export function displayStatus(hw) {
  const status = hw?.submissionStatus || "pending";
  return resultsHidden(hw) && status === "graded" ? "submitted" : status;
}

// A void voucher is not a bill — it was cancelled (usually replaced by a
// regenerated one). The server leaves them out of the portal list; if one is
// ever returned it shows no balance.
export const VOID_VOUCHER_LABEL = "Cancelled — replaced";

export function isVoidVoucher(v) {
  return !!v && (v.status === "void" || v.isVoid === true);
}

// Pages in a fee list of `total` vouchers shown `limit` at a time (at least 1).
export function pageCount(total, limit) {
  const t = Number(total) || 0;
  const l = Number(limit) || 0;
  if (t <= 0 || l <= 0) return 1;
  return Math.ceil(t / l);
}
