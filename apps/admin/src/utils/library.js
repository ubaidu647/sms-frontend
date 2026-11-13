// Pure helpers for the Library screens (circulation, loans, fines, settings).
// No React / browser imports so they can be unit-tested with `node --test`.
import { addDaysYMD, localYMD } from './localDate.js';
import { round2 } from './money.js';

// The API's cap on copies created in one request.
export const MAX_COPIES_PER_REQUEST = 200;

export const LIBRARY_DEFAULT_SETTINGS = {
  student: { maxBooks: 2, loanDays: 14 },
  staff: { maxBooks: 5, loanDays: 30 },
  finePerDay: 5,
  maxFinePerLoan: null,
  graceDays: 0,
};

export const BORROWER_TYPES = ['student', 'staff'];
export const LOAN_STATUSES = ['issued', 'overdue', 'returned', 'lost'];
export const FINE_STATUSES = ['none', 'pending', 'billed', 'waived', 'paid'];
export const COPY_CONDITIONS = ['good', 'fair', 'poor'];
export const MAX_RENEWALS = 2;
export const MIN_LOAN_DAYS = 1;
export const MAX_LOAN_DAYS = 90;

export const FINE_STATUS_COLORS = {
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  billed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  waived: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

export const LOAN_STATUS_COLORS = {
  issued: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  returned: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  lost: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

export const COPY_STATUS_COLORS = {
  available: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  issued: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  lost: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  withdrawn: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export const SETTINGS_SOURCE_LABELS = {
  branch: 'Branch setting',
  school: 'School default',
  default: 'Built-in default',
};

/**
 * Scanner / keyboard input → lookup code: trims (scanners often append CR/LF
 * or a tab), drops control characters and uppercases ("acc-000012 " →
 * "ACC-000012").
 */
export function normalizeCode(raw) {
  return (
    String(raw ?? '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim()
      .toUpperCase()
  );
}

/**
 * Date-only value → 'YYYY-MM-DD'. Accepts 'YYYY-MM-DD', a stored ISO
 * timestamp (UTC midnight → its UTC date) or a Date. '' when unusable.
 */
export function ymdOf(value) {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.toISOString().slice(0, 10);
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** Whole calendar days from `a` to `b` (b − a); null when either is invalid. */
export function diffDaysYMD(a, b) {
  const x = ymdOf(a);
  const y = ymdOf(b);
  if (!x || !y) return null;
  const toUtc = (s) =>
    Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
  return Math.round((toUtc(y) - toUtc(x)) / 86400000);
}

/** Days past the due date on `today` (0 when not yet due / invalid). */
export function overdueDays(dueDate, today = localYMD()) {
  const d = diffDaysYMD(dueDate, today);
  return d && d > 0 ? d : 0;
}

/** True for an open (issued) loan whose due date has passed. */
export function isLoanOverdue(loan, today = localYMD()) {
  return loan?.status === 'issued' && overdueDays(loan?.dueDate, today) > 0;
}

/** Display status: an issued loan past due shows as 'overdue'. */
export function loanDisplayStatus(loan, today = localYMD()) {
  if (isLoanOverdue(loan, today)) return 'overdue';
  return loan?.status || 'issued';
}

/**
 * Fine the server would charge for returning on `returnedAt`:
 * lateDays = max(0, returnedAt − dueDate − graceDays); amount = lateDays ×
 * finePerDay, capped by maxFinePerLoan when set (> 0).
 */
export function previewFine({ dueDate, returnedAt = localYMD(), settings = {} } = {}) {
  const grace = Math.max(0, Number(settings.graceDays) || 0);
  const perDay = Math.max(0, Number(settings.finePerDay) || 0);
  const late = diffDaysYMD(dueDate, returnedAt);
  const days = late === null ? 0 : Math.max(0, late - grace);
  let amount = round2(days * perDay);
  const cap = Number(settings.maxFinePerLoan);
  if (settings.maxFinePerLoan !== null && settings.maxFinePerLoan !== undefined && cap > 0) {
    amount = Math.min(amount, cap);
  }
  return { days, amount };
}

/** Default due date: issue date + the borrower type's loan days. */
export function defaultDueDate(issueDate = localYMD(), loanDays = 14) {
  const n = Math.max(MIN_LOAN_DAYS, Math.round(Number(loanDays) || 0) || 14);
  return addDaysYMD(ymdOf(issueDate) || localYMD(), n);
}

/** '' when `dueDate` is 1–90 days after `issueDate`, else an error message. */
export function validateDueDate(dueDate, issueDate = localYMD()) {
  const d = diffDaysYMD(issueDate, dueDate);
  if (d === null) return 'Pick a valid due date';
  if (d < MIN_LOAN_DAYS) return 'Due date must be after today';
  if (d > MAX_LOAN_DAYS) return `Due date can be at most ${MAX_LOAN_DAYS} days away`;
  return '';
}

/** Effective limits for a borrower type from a settings object (with defaults). */
export function limitsFor(settings, borrowerType) {
  const def = LIBRARY_DEFAULT_SETTINGS[borrowerType] || LIBRARY_DEFAULT_SETTINGS.student;
  const s = settings?.[borrowerType] || {};
  return {
    maxBooks: Number(s.maxBooks) || def.maxBooks,
    loanDays: Number(s.loanDays) || def.loanDays,
  };
}

/** "a, b ; c" → ['a','b','c'] (trimmed, empties dropped, de-duplicated). */
export function splitList(raw) {
  if (Array.isArray(raw)) return [...new Set(raw.map((s) => String(s).trim()).filter(Boolean))];
  return [
    ...new Set(
      String(raw ?? '')
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

/** Book form values → API payload (empty optionals dropped). */
export function buildBookPayload(values, { isCreate = false } = {}) {
  const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
  const payload = {
    title: str(values.title),
    authors: splitList(values.authors),
  };
  ['isbn', 'publisher', 'edition', 'category', 'language', 'shelf'].forEach((k) => {
    const v = str(values[k]);
    if (v || !isCreate) payload[k] = v;
  });
  const year = str(values.year);
  if (year) payload.year = Number(year);
  else if (!isCreate) payload.year = null;
  payload.tags = splitList(values.tags);
  if (isCreate) {
    if (values.branchId) payload.branchId = values.branchId;
    const copies = Number(values.copies);
    if (copies > 0) payload.copies = Math.floor(copies);
  }
  return payload;
}

/** Loans filter state → query params (empty values dropped). */
export function buildLoanListParams(filters = {}) {
  const out = {};
  ['branchId', 'status', 'borrowerType', 'studentId', 'staffId', 'from', 'to'].forEach((k) => {
    if (filters[k]) out[k] = filters[k];
  });
  return out;
}

/** Row actions allowed on a loan for a user who may (or may not) manage it. */
export function loanRowActions(loan, { canManage = false, today = localYMD() } = {}) {
  if (!loan || !canManage) return [];
  const actions = [];
  if (loan.status === 'issued') {
    actions.push('return');
    if (!isLoanOverdue(loan, today) && (Number(loan.renewals) || 0) < MAX_RENEWALS) {
      actions.push('renew');
    }
    actions.push('lost');
  }
  if (loan.fine?.status === 'pending') {
    actions.push('waive');
    if (loan.borrowerType === 'staff') actions.push('fine-paid');
  }
  return actions;
}

/** Sum of a pendingFines value that may be an amount or an array of loans/fines. */
export function pendingFineTotal(pending) {
  if (Array.isArray(pending)) {
    return round2(pending.reduce((sum, p) => sum + (Number(p?.fine?.amount ?? p?.amount) || 0), 0));
  }
  if (pending && typeof pending === 'object')
    return round2(Number(pending.amount ?? pending.total) || 0);
  return round2(Number(pending) || 0);
}

const nameOf = (p) => p?.user?.name || p?.userId?.name || p?.name || '';

/** Borrower display name from a (possibly populated) loan. */
export function loanBorrowerName(loan) {
  if (!loan) return '—';
  const b =
    loan.borrower ||
    (loan.borrowerType === 'staff' ? loan.staff || loan.staffId : loan.student || loan.studentId);
  return nameOf(b) || loan.borrowerName || (loan.borrowerType === 'staff' ? 'Staff' : 'Student');
}

/** Borrower id from a loan whose student/staff ref may be populated. */
export function loanBorrowerId(loan) {
  if (!loan) return '';
  const ref =
    loan.borrowerType === 'staff' ? loan.staffId || loan.staff : loan.studentId || loan.student;
  return String(ref?._id || ref || loan.borrower?._id || '');
}

/** Book title / accession number from a (possibly populated) loan. */
export function loanBookTitle(loan) {
  return loan?.book?.title || loan?.bookId?.title || loan?.title || '—';
}
export function loanAccession(loan) {
  return (
    loan?.copy?.accessionNumber || loan?.copyId?.accessionNumber || loan?.accessionNumber || '—'
  );
}

/** Settings form values → PUT payload. */
export function buildSettingsPayload(values, branchId) {
  const int = (v) => Math.max(0, Math.round(Number(v) || 0));
  const cap = values.maxFinePerLoan;
  return {
    branchId: branchId || null,
    student: { maxBooks: int(values.studentMaxBooks), loanDays: int(values.studentLoanDays) },
    staff: { maxBooks: int(values.staffMaxBooks), loanDays: int(values.staffLoanDays) },
    finePerDay: round2(Math.max(0, Number(values.finePerDay) || 0)),
    maxFinePerLoan:
      cap === '' || cap === null || cap === undefined || Number(cap) <= 0
        ? null
        : round2(Number(cap)),
    graceDays: int(values.graceDays),
  };
}

/** Settings object → flat form values. */
export function settingsToForm(settings) {
  const s = settings || LIBRARY_DEFAULT_SETTINGS;
  const st = limitsFor(s, 'student');
  const sf = limitsFor(s, 'staff');
  return {
    studentMaxBooks: st.maxBooks,
    studentLoanDays: st.loanDays,
    staffMaxBooks: sf.maxBooks,
    staffLoanDays: sf.loanDays,
    finePerDay: s.finePerDay ?? LIBRARY_DEFAULT_SETTINGS.finePerDay,
    maxFinePerLoan: s.maxFinePerLoan ?? '',
    graceDays: s.graceDays ?? 0,
  };
}
