// Pure helpers for the leave page: local calendar dates and form validation.
// Mirrors the backend rules (real YYYY-MM-DD, from ≤ to, at most 60 days,
// reason 3–500 chars, student leave types) so most mistakes are caught before
// the request; the server stays the authority (overlaps → 409, etc.).

const pad = (n) => String(n).padStart(2, "0");

export const STUDENT_LEAVE_TYPES = ["sick", "casual", "other"];
export const MAX_LEAVE_SPAN_DAYS = 60;
export const REASON_MIN = 3;
export const REASON_MAX = 500;

/** Local YYYY-MM-DD of `date` (default: now). Never toISOString (UTC). */
export function localYMD(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** [y, m0, d] for a real calendar date "YYYY-MM-DD", else null. */
export function parseYMD(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? ""));
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

export const isValidYMD = (ymd) => parseYMD(ymd) !== null;

/** `ymd` shifted by `n` calendar days (pure calendar math). */
export function addDaysYMD(ymd, n) {
  const p = parseYMD(ymd);
  if (!p) return "";
  const d = new Date(Date.UTC(p[0], p[1], p[2] + n));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Calendar days from..to inclusive (1 for the same day); null if invalid. */
export function spanDays(fromYMD, toYMD) {
  const a = parseYMD(fromYMD);
  const b = parseYMD(toYMD);
  if (!a || !b) return null;
  const ms = Date.UTC(...b) - Date.UTC(...a);
  return Math.round(ms / 86400000) + 1;
}

/**
 * Validates the apply form. Returns { field: message } — empty when valid.
 * Fields: leaveType, fromDate, toDate, reason.
 */
export function validateLeaveForm({ leaveType, fromDate, toDate, reason }) {
  const errors = {};
  if (!STUDENT_LEAVE_TYPES.includes(leaveType)) {
    errors.leaveType = "Choose a leave type";
  }
  if (!fromDate) errors.fromDate = "From date is required";
  else if (!isValidYMD(fromDate)) errors.fromDate = "Enter a valid date";
  if (!toDate) errors.toDate = "To date is required";
  else if (!isValidYMD(toDate)) errors.toDate = "Enter a valid date";

  if (!errors.fromDate && !errors.toDate) {
    const span = spanDays(fromDate, toDate);
    if (span < 1) {
      errors.toDate = "To date cannot be before the from date";
    } else if (span > MAX_LEAVE_SPAN_DAYS) {
      errors.toDate = `Leave cannot be longer than ${MAX_LEAVE_SPAN_DAYS} days`;
    }
  }

  const r = String(reason ?? "").trim();
  if (r.length < REASON_MIN) {
    errors.reason = `Reason must be at least ${REASON_MIN} characters`;
  } else if (r.length > REASON_MAX) {
    errors.reason = `Reason must be at most ${REASON_MAX} characters`;
  }
  return errors;
}

/** A parent may cancel only PENDING requests that a parent created. */
export function canParentCancel(request) {
  return (
    request?.status === "pending" && request?.requestedBy?.role === "parent"
  );
}
