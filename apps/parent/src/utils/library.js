// Pure helpers for the Library page: local calendar dates, overdue days and
// labels. Dates from the API are "YYYY-MM-DD" (or ISO strings); "today" is
// always the LOCAL date, never toISOString (UTC).

const pad = (n) => String(n).padStart(2, "0");
const DAY_MS = 24 * 60 * 60 * 1000;

/** Local YYYY-MM-DD of `date` (default: now). */
export function localYMD(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" (a leading date part of an ISO string is accepted) → [y, m0, d], else null. */
export function parseYMD(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return [y, mo, d];
}

/** Whole calendar days from `a` to `b` (b − a); null when either is invalid. */
export function daysBetween(a, b) {
  const pa = parseYMD(a);
  const pb = parseYMD(b);
  if (!pa || !pb) return null;
  return Math.round((Date.UTC(...pb) - Date.UTC(...pa)) / DAY_MS);
}

/** Days past the due date as of `today` (local), 0 when not overdue or invalid. */
export function overdueDays(dueDate, today = localYMD()) {
  const diff = daysBetween(dueDate, today);
  return diff && diff > 0 ? diff : 0;
}

/** Overdue days of an open loan: the server's `overdueDays` when given, else computed. */
export function loanOverdueDays(loan, today = localYMD()) {
  if (!loan) return 0;
  const n = Number(loan.overdueDays);
  if (
    Number.isFinite(n) &&
    loan.overdueDays !== null &&
    loan.overdueDays !== ""
  )
    return Math.max(0, Math.floor(n));
  return overdueDays(loan.dueDate, today);
}

/** Short status text for an open loan's due date. */
export function dueLabel(dueDate, today = localYMD()) {
  const diff = daysBetween(today, dueDate);
  if (diff === null) return "";
  if (diff < 0) {
    const n = -diff;
    return `Overdue by ${n} day${n === 1 ? "" : "s"}`;
  }
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff} days`;
}

/**
 * Formats a calendar date for display without a UTC shift: "2026-10-13" is
 * shown as 13 Oct 2026 in every timezone. "—" for empty/invalid values.
 */
export function formatLibraryDate(
  value,
  opts = { day: "numeric", month: "short", year: "numeric" },
) {
  const p = parseYMD(value);
  if (!p) return "—";
  return new Date(p[0], p[1], p[2]).toLocaleDateString(undefined, opts);
}

/** "A, B" for an authors array (or a plain string); "" when none. */
export function formatAuthors(authors) {
  if (Array.isArray(authors))
    return authors
      .map((a) => String(a ?? "").trim())
      .filter(Boolean)
      .join(", ");
  return String(authors ?? "").trim();
}

/** Total pages for a pager (at least 1). */
export function totalPages(total, limit) {
  const t = Number(total) || 0;
  const l = Number(limit) || 1;
  return Math.max(1, Math.ceil(t / l));
}
