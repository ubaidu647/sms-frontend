// Calendar dates ("today", "a month ago", "this month") in the user's own
// timezone. `toISOString()` is UTC, which in Pakistan (UTC+5) between 00:00
// and 05:00 still reads as yesterday — so every default date filter / form
// value is built from the local date parts instead.
//
// Do NOT use these to re-format a stored date-only value from the server
// (stored as UTC midnight); those keep UTC formatting (`toYMD(iso)`).

const pad = (n) => String(n).padStart(2, '0');

/** Local YYYY-MM-DD of `date` (default: now). */
export function localYMD(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local YYYY-MM of `date` (default: now). */
export function localYM(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function parseYMD(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? ''));
  if (!m) return null;
  return [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
}

/** `ymd` shifted by `n` calendar days (pure calendar math, no timezone). */
export function addDaysYMD(ymd, n) {
  const parts = parseYMD(ymd);
  if (!parts) return '';
  const d = new Date(Date.UTC(parts[0], parts[1], parts[2] + n));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * `ymd` shifted by `n` calendar months, clamped to the last day of the target
 * month (Mar 31 − 1 month → Feb 28/29, not Mar 3).
 */
export function addMonthsYMD(ymd, n) {
  const parts = parseYMD(ymd);
  if (!parts) return '';
  const [y, m, d] = parts;
  const first = new Date(Date.UTC(y, m + n, 1));
  const ty = first.getUTCFullYear();
  const tm = first.getUTCMonth();
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${ty}-${pad(tm + 1)}-${pad(Math.min(d, lastDay))}`;
}

/** Local date `n` days before `from` (default: now). */
export function daysAgoYMD(n, from = new Date()) {
  return addDaysYMD(localYMD(from), -n);
}

/** Local date `n` months before `from` (default: now). */
export function monthsAgoYMD(n, from = new Date()) {
  return addMonthsYMD(localYMD(from), -n);
}

/** First day of the local month of `date` (default: now). */
export function startOfMonthYMD(date = new Date()) {
  return `${localYM(date)}-01`;
}
