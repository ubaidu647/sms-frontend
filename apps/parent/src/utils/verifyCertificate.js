// Pure helpers for the public certificate verification page.

export const CODE_LENGTH = 10;

export const CERTIFICATE_TYPE_LABELS = {
  slc: "School Leaving / Transfer Certificate",
  character: "Character Certificate",
  bonafide: "Bonafide Certificate",
  "fee-clearance": "Fee Clearance Certificate",
};

/** Uppercase and strip whitespace/dashes (and URL-encoded spaces). */
export function normalizeCode(raw) {
  if (raw == null) return "";
  let s = String(raw);
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep as is
  }
  return s.replace(/[\s\-–—_]+/g, "").toUpperCase();
}

export function isValidCode(code) {
  return typeof code === "string" && /^[A-Z0-9]{10}$/.test(code);
}

export function certificateTypeLabel(type) {
  return CERTIFICATE_TYPE_LABELS[type] || "Certificate";
}

/** 'YYYY-MM-DD' or ISO date-time → 'dd-MM-yyyy'; '' when unusable. */
export function formatIssueDate(value) {
  if (!value) return "";
  const s = String(value);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/** Map an axios error to a page state. */
export function verifyErrorState(err) {
  const status = err?.response?.status;
  if (status === 404) return "notfound";
  if (status === 429) return "ratelimited";
  return "error";
}
