// Academic year ("2025-2026") helpers. A school year starts in a fixed month
// (April by default, matching the backend) — so Jan–Mar still belong to the
// year that started the previous April. Built from LOCAL date parts.

const DEFAULT_START_MONTH = 4;
const YEAR_RE = /^(\d{4})-(\d{4})$/;

/** Parses a 1–12 month value; anything else falls back to April. */
export function parseStartMonth(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : DEFAULT_START_MONTH;
}

/** Start month (1–12) from NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH, default 4. */
export function academicYearStartMonth() {
  // Referenced literally so Next.js inlines it into the client bundle.
  let raw;
  try {
    raw = process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
  } catch {
    raw = undefined;
  }
  return parseStartMonth(raw);
}

/** Academic year containing `date` (default: now), e.g. "2026-2027". */
export function currentAcademicYear(date = new Date(), startMonth = academicYearStartMonth()) {
  const month = date.getMonth() + 1;
  const start = month >= parseStartMonth(startMonth) ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

/** "2025-2026" → "2026-2027"; '' for anything that isn't a YYYY-YYYY year. */
export function nextAcademicYear(year) {
  const m = YEAR_RE.exec(String(year ?? ''));
  if (!m) return '';
  const a = Number(m[1]) + 1;
  return `${a}-${a + 1}`;
}

/** "2025-2026" → "2024-2025"; '' when invalid. */
export function previousAcademicYear(year) {
  const m = YEAR_RE.exec(String(year ?? ''));
  if (!m) return '';
  const a = Number(m[1]) - 1;
  return `${a}-${a + 1}`;
}
