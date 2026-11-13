// Pure helpers for the public admission enquiry form (/apply/[key]).
// Mirrors the backend caps so most mistakes are caught before the request;
// the server stays the authority (its 400 message is shown as-is).

export const NAME_MAX = 100;
export const SCHOOL_MAX = 100;
export const CLASS_MAX = 50;
export const EMAIL_MAX = 100;
export const ADDRESS_MAX = 300;
export const NOTES_MAX = 1000;

export const GENDERS = ["male", "female", "other"];
export const RELATIONS = ["father", "mother", "guardian", "other"];

export const EMPTY_FORM = Object.freeze({
  childName: "",
  gender: "",
  dob: "",
  previousSchool: "",
  previousClass: "",
  desiredGrade: "",
  guardianName: "",
  relation: "father",
  phone: "",
  email: "",
  address: "",
  notes: "",
});

const pad = (n) => String(n).padStart(2, "0");

/** Local YYYY-MM-DD of `date` (default: now). */
export function localYMD(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The backend refuses a date of birth more than this many years back. */
export const MAX_CHILD_AGE_YEARS = 30;

/** Earliest date of birth the backend accepts: `today` minus MAX_CHILD_AGE_YEARS. */
export function oldestDobYMD(today = localYMD()) {
  return `${Number(today.slice(0, 4)) - MAX_CHILD_AGE_YEARS}${today.slice(4)}`;
}

/** True for a real calendar date "YYYY-MM-DD". */
export function isValidYMD(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd ?? ""));
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo &&
    dt.getUTCDate() === d
  );
}

/** Trim and collapse internal whitespace runs to one space. */
export function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trim, keeping line breaks (for address / notes) but no trailing spaces. */
export function cleanMultiline(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Strip spaces, dashes, dots and brackets from a phone number; a leading
 * "00" international prefix becomes "+". Returns the cleaned string (which
 * may still be invalid — see isValidPkPhone).
 */
export function normalizePhone(value) {
  let s = String(value ?? "")
    .trim()
    .replace(/[\s\-.()]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  return s;
}

/**
 * Pakistani phone numbers after normalisation:
 * - mobile: 03XXXXXXXXX (11 digits), +923XXXXXXXXX, 923XXXXXXXXX
 * - landline: 0 + area code + number (10–11 digits), +92 / 92 + 9–10 digits
 */
export function isValidPkPhone(value) {
  const s = normalizePhone(value);
  if (/^03\d{9}$/.test(s)) return true;
  if (/^(\+92|92)3\d{9}$/.test(s)) return true;
  if (/^0[1-24-9]\d{8,9}$/.test(s)) return true;
  if (/^(\+92|92)[1-24-9]\d{8,9}$/.test(s)) return true;
  return false;
}

export function isValidEmail(value) {
  const s = String(value ?? "").trim();
  if (!s || s.length > EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/**
 * Validate the form. `grades` is the list returned by the public GET
 * ([{ value, label }]); when non-empty the desired grade must be one of them.
 * Returns { valid, errors: { field: message } }.
 */
export function validateApplyForm(form, { grades = [], today } = {}) {
  const f = { ...EMPTY_FORM, ...(form || {}) };
  const errors = {};
  const len = (v) => String(v ?? "").length;

  const childName = cleanText(f.childName);
  if (!childName) errors.childName = "Child's name is required.";
  else if (childName.length < 2) errors.childName = "Name is too short.";
  else if (childName.length > NAME_MAX)
    errors.childName = `At most ${NAME_MAX} characters.`;

  if (f.gender && !GENDERS.includes(f.gender))
    errors.gender = "Choose a valid gender.";

  if (f.dob) {
    const todayYMD = today || localYMD();
    if (!isValidYMD(f.dob)) errors.dob = "Enter a valid date.";
    else if (f.dob >= todayYMD)
      errors.dob = "Date of birth must be in the past.";
    else if (f.dob < oldestDobYMD(todayYMD))
      errors.dob = "Enter a valid date of birth.";
  }

  if (len(cleanText(f.previousSchool)) > SCHOOL_MAX)
    errors.previousSchool = `At most ${SCHOOL_MAX} characters.`;
  if (len(cleanText(f.previousClass)) > CLASS_MAX)
    errors.previousClass = `At most ${CLASS_MAX} characters.`;

  if (!f.desiredGrade)
    errors.desiredGrade = "Choose the class you're applying for.";
  else if (
    grades.length > 0 &&
    !grades.some((g) => String(g.value) === String(f.desiredGrade))
  )
    errors.desiredGrade = "Choose a class from the list.";

  const guardianName = cleanText(f.guardianName);
  if (!guardianName) errors.guardianName = "Guardian's name is required.";
  else if (guardianName.length < 2) errors.guardianName = "Name is too short.";
  else if (guardianName.length > NAME_MAX)
    errors.guardianName = `At most ${NAME_MAX} characters.`;

  if (!RELATIONS.includes(f.relation)) errors.relation = "Choose a relation.";

  if (!String(f.phone ?? "").trim()) errors.phone = "Phone number is required.";
  else if (!isValidPkPhone(f.phone))
    errors.phone =
      "Enter a valid phone number, e.g. 0300-1234567 or +92 300 1234567.";

  if (String(f.email ?? "").trim() && !isValidEmail(f.email))
    errors.email = "Enter a valid email address.";

  if (len(cleanMultiline(f.address)) > ADDRESS_MAX)
    errors.address = `At most ${ADDRESS_MAX} characters.`;
  if (len(cleanMultiline(f.notes)) > NOTES_MAX)
    errors.notes = `At most ${NOTES_MAX} characters.`;

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Request body for POST /public/admission/:key. Optional fields are omitted
 * when blank so the backend's strict validation never sees empty strings.
 */
export function buildApplyPayload(
  form,
  { website = "", startedAt, fillMs } = {},
) {
  const f = { ...EMPTY_FORM, ...(form || {}) };
  const opt = (obj, key, value) => {
    if (value) obj[key] = value;
  };

  const child = { name: cleanText(f.childName) };
  opt(child, "gender", f.gender);
  opt(child, "dob", f.dob);
  opt(child, "previousSchool", cleanText(f.previousSchool));
  opt(child, "previousClass", cleanText(f.previousClass));

  const guardian = {
    name: cleanText(f.guardianName),
    relation: f.relation,
    phone: normalizePhone(f.phone),
  };
  opt(
    guardian,
    "email",
    String(f.email ?? "")
      .trim()
      .toLowerCase(),
  );

  const body = { child, desiredGrade: String(f.desiredGrade), guardian };
  opt(body, "address", cleanMultiline(f.address));
  opt(body, "notes", cleanMultiline(f.notes));
  body.website = String(website ?? "");
  body.startedAt = Number(startedAt) || 0;
  body.fillMs = toFillMs(fillMs);
  return body;
}

/** Longest fill time sent: a form left open overnight is slow, not invalid. */
export const MAX_FILL_MS = 86_400_000; // 24h

/**
 * Non-negative whole milliseconds, at most MAX_FILL_MS; anything unusable
 * becomes 0.
 */
export function toFillMs(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), MAX_FILL_MS) : 0;
}

/**
 * Milliseconds between two readings of the same clock (performance.now()
 * when available, else Date.now()). A missing start or a clock that went
 * backwards yields 0 rather than a negative/NaN duration.
 */
export function elapsedMs(start, now) {
  const a = Number(start);
  const b = Number(now);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0) return 0;
  return toFillMs(b - a);
}

/**
 * Success-screen data from the public POST response body's `data`:
 * prefers the random public `reference` (e.g. "ENQ-7KX3P9"), falling back
 * to a legacy `enquiryNumber`.
 */
export function applyResult(data, fallbackMessage) {
  const d = data && typeof data === "object" ? data : {};
  const pick = (v) => (typeof v === "string" && v.trim() ? v.trim() : "");
  return {
    reference: pick(d.reference) || pick(d.enquiryNumber),
    message: pick(d.message) || pick(fallbackMessage),
  };
}

/** User-facing message for a failed public request (axios-like error). */
export function applyErrorMessage(error) {
  const status = error?.response?.status;
  const raw = error?.response?.data?.message;
  const serverMsg = typeof raw === "string" && raw.trim() ? raw : "";
  // 429/503 carry a specific reason (e.g. how long to wait, form paused).
  if (status === 429)
    return serverMsg || "Too many submissions, please try later.";
  if (status === 503)
    return serverMsg || "Something went wrong. Please try again.";
  if (status === 404) return "This admission form is not available.";
  if (status === 400)
    return serverMsg || "Please check the form and try again.";
  if (!error?.response)
    return "Can't reach the server right now. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
