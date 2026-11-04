// Academic year ("2025-2026") helpers. A school year starts in a fixed month
// (April by default, matching the backend) — so Jan–Mar still belong to the
// year that started the previous April. Built from LOCAL date parts.
//
// The month is the one the API reports in force for the school (GET
// /schools/settings → effectiveAcademicYearStartMonth, applied with
// setSchoolAcademicYearStartMonth by the dashboard layout); before that answers
// (or when it fails), the month remembered for this user, else
// NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH, else April.

const DEFAULT_START_MONTH = 4;
const YEAR_RE = /^(\d{4})-(\d{4})$/;

/** Parses a 1–12 month value; anything else falls back to April. */
export function parseStartMonth(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : DEFAULT_START_MONTH;
}

// Remembered per signed-in user (`<prefix>:<userKey>`), so the next person on
// this browser never starts from the previous school's month. The bare prefix
// is the key older builds wrote; it is only ever removed.
const STORAGE_PREFIX = 'sms-academic-year-start-month';
const storageKey = (userKey) => `${STORAGE_PREFIX}:${userKey}`;

/** A 1–12 month number, or null for anything else. */
function monthOrNull(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

// The signed-in user (whose remembered month applies) and their school's start
// month; null month = follow the env default.
let activeUser = null;
let schoolStartMonth = null;
let schoolStartMonthLoaded = false;

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Select whose remembered month applies (the dashboard layout calls this, via
 * useSchoolSettings, as soon as the user is known). Switching user drops the
 * in-memory month: until the settings request answers, the new user gets their
 * own remembered month, else the env default — never the previous school's.
 */
export function setAcademicYearUser(userKey) {
  const next = userKey ? String(userKey) : null;
  if (next === activeUser) return;
  activeUser = next;
  schoolStartMonth = null;
  schoolStartMonthLoaded = false;
}

/** The user whose month is in force (null once signed out). */
export function academicYearUser() {
  return activeUser;
}

/**
 * Record the school's start month (1–12) — the month the API actually uses —
 * or null to follow the env default. Remembered in localStorage for the active
 * user so a reload starts from the right year before the settings request
 * comes back.
 */
export function setSchoolAcademicYearStartMonth(month) {
  schoolStartMonth = monthOrNull(month);
  schoolStartMonthLoaded = true;
  const store = storage();
  if (!store || !activeUser) return;
  try {
    if (schoolStartMonth) store.setItem(storageKey(activeUser), String(schoolStartMonth));
    else store.removeItem(storageKey(activeUser));
  } catch {
    // storage full or blocked — the in-memory value still applies
  }
}

/** The school's start month, or null when it has none (or none is known yet). */
export function schoolAcademicYearStartMonth() {
  if (schoolStartMonthLoaded) return schoolStartMonth;
  if (!activeUser) return null;
  try {
    return monthOrNull(storage()?.getItem(storageKey(activeUser)));
  } catch {
    return null;
  }
}

/**
 * The start month to apply from a GET/PUT /schools/settings payload: the
 * month the API actually uses (`effectiveAcademicYearStartMonth`, which
 * includes its own env fallback), else the school's own setting (null =
 * default), so the client always agrees with the server.
 */
export function startMonthFromSettings(settings) {
  return (
    monthOrNull(settings?.effectiveAcademicYearStartMonth) ??
    monthOrNull(settings?.academicYearStartMonth)
  );
}

/**
 * Sign-out: forget the in-memory month and every remembered one (any user's,
 * plus the old un-keyed entry), so the next session falls back to the env
 * default until its own settings arrive.
 */
export function clearAcademicYearStartMonth() {
  activeUser = null;
  schoolStartMonth = null;
  schoolStartMonthLoaded = false;
  const store = storage();
  if (!store) return;
  try {
    const keys = [];
    for (let i = 0; i < store.length; i += 1) {
      const k = store.key(i);
      if (k === STORAGE_PREFIX || k?.startsWith(`${STORAGE_PREFIX}:`)) keys.push(k);
    }
    keys.forEach((k) => store.removeItem(k));
  } catch {
    // storage blocked — nothing was remembered
  }
}

/** Start month (1–12) from NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH, default 4. */
export function defaultAcademicYearStartMonth() {
  // Referenced literally so Next.js inlines it into the client bundle.
  let raw;
  try {
    raw = process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
  } catch {
    raw = undefined;
  }
  return parseStartMonth(raw);
}

/**
 * The start month (1–12) in force: the school's own setting, else
 * NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH, else April.
 */
export function academicYearStartMonth() {
  return schoolAcademicYearStartMonth() ?? defaultAcademicYearStartMonth();
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

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "August" for 8; '' for anything that isn't a 1–12 month. */
export function monthName(month) {
  const n = monthOrNull(month);
  return n ? MONTH_NAMES[n - 1] : '';
}
