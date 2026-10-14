// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  localYMD,
  parseYMD,
  daysBetween,
  overdueDays,
  loanOverdueDays,
  dueLabel,
  formatLibraryDate,
  formatAuthors,
  totalPages,
} from "./library.js";

test("localYMD uses local date parts, zero-padded", () => {
  assert.equal(localYMD(new Date(2026, 0, 5, 0, 30)), "2026-01-05");
  assert.equal(localYMD(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
});

test("parseYMD accepts real dates and ISO prefixes only", () => {
  assert.deepEqual(parseYMD("2026-10-13"), [2026, 9, 13]);
  assert.deepEqual(parseYMD("2026-10-13T00:00:00.000Z"), [2026, 9, 13]);
  assert.equal(parseYMD("2026-02-29"), null);
  assert.equal(parseYMD("13/10/2026"), null);
  assert.equal(parseYMD(undefined), null);
});

test("daysBetween is calendar math across months and years", () => {
  assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
  assert.equal(daysBetween("2026-03-01", "2026-02-28"), -1);
  assert.equal(daysBetween("2026-10-13", "2026-10-13"), 0);
  assert.equal(daysBetween("bad", "2026-10-13"), null);
});

test("overdueDays counts days past due, never negative", () => {
  assert.equal(overdueDays("2026-10-10", "2026-10-13"), 3);
  assert.equal(overdueDays("2026-10-13", "2026-10-13"), 0);
  assert.equal(overdueDays("2026-10-20", "2026-10-13"), 0);
  assert.equal(overdueDays(null, "2026-10-13"), 0);
});

test("loanOverdueDays prefers the server value, else computes", () => {
  assert.equal(
    loanOverdueDays({ overdueDays: 4, dueDate: "2026-10-12" }, "2026-10-13"),
    4,
  );
  assert.equal(
    loanOverdueDays({ overdueDays: 0, dueDate: "2026-10-01" }, "2026-10-13"),
    0,
  );
  assert.equal(loanOverdueDays({ dueDate: "2026-10-11" }, "2026-10-13"), 2);
  assert.equal(
    loanOverdueDays({ overdueDays: null, dueDate: "2026-10-12" }, "2026-10-13"),
    1,
  );
  assert.equal(loanOverdueDays(null), 0);
});

test("dueLabel describes the due date relative to today", () => {
  const today = "2026-10-13";
  assert.equal(dueLabel("2026-10-12", today), "Overdue by 1 day");
  assert.equal(dueLabel("2026-10-08", today), "Overdue by 5 days");
  assert.equal(dueLabel("2026-10-13", today), "Due today");
  assert.equal(dueLabel("2026-10-14", today), "Due tomorrow");
  assert.equal(dueLabel("2026-10-20", today), "Due in 7 days");
  assert.equal(dueLabel("", today), "");
});

test("formatLibraryDate keeps the calendar day (no UTC shift)", () => {
  const opts = { year: "numeric", month: "2-digit", day: "2-digit" };
  assert.equal(
    formatLibraryDate("2026-10-13", opts),
    new Date(2026, 9, 13).toLocaleDateString(undefined, opts),
  );
  assert.equal(formatLibraryDate(""), "—");
  assert.equal(formatLibraryDate("nope"), "—");
});

test("formatAuthors joins arrays and trims", () => {
  assert.equal(
    formatAuthors(["A. Writer", " B. Poet ", "", null]),
    "A. Writer, B. Poet",
  );
  assert.equal(formatAuthors("Solo"), "Solo");
  assert.equal(formatAuthors(undefined), "");
});

test("totalPages is at least 1", () => {
  assert.equal(totalPages(0, 20), 1);
  assert.equal(totalPages(41, 20), 3);
  assert.equal(totalPages(undefined, undefined), 1);
});
