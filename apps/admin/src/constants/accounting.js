// Chart of Accounts / Ledger constants — mirrors the backend contract for
// /api/account, /api/ledger and /api/ledger/report. Kept alongside constants/fee.js
// so the finance modules share formatting helpers and vocabulary.

export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'];

// Normal balance side per type — drives which column a positive balance lands in
// and helps label the create form. Assets/expenses are debit-natured; the rest credit.
export const ACCOUNT_TYPE_NORMAL_SIDE = {
  asset: 'debit',
  expense: 'debit',
  liability: 'credit',
  equity: 'credit',
  income: 'credit',
};

export const ACCOUNT_TYPE_COLORS = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-amber-100 text-amber-800',
  equity: 'bg-purple-100 text-purple-800',
  income: 'bg-green-100 text-green-700',
  expense: 'bg-red-100 text-red-700',
};

export const ACCOUNT_STATUSES = ['active', 'inactive'];

// Sub-ledger kinds a control account can track parties against.
export const SUB_LEDGER_TYPES = ['student', 'staff', 'vendor'];

/* ---------------------------- Money category ---------------------------- */
// Every postable (level-3 / subsidiary) account declares its money nature when
// it's created. This is what makes an account eligible for the cash/bank mapping
// roles — without it the ledger has no way to tell a cash head from any other
// asset account, so cash and bank could not be mapped.
export const ACCOUNT_CATEGORIES = ['cash', 'bank', 'other'];

export const ACCOUNT_CATEGORY_LABELS = {
  cash: 'Cash',
  bank: 'Bank',
  other: 'Other',
};

export const ACCOUNT_CATEGORY_HINTS = {
  cash: 'Cash in hand / petty cash — usually one per branch',
  bank: 'A bank or online payment account',
  other: 'Everything else — income, expense, receivable, payable…',
};

export const ACCOUNT_CATEGORY_COLORS = {
  cash: 'bg-emerald-100 text-emerald-800',
  bank: 'bg-sky-100 text-sky-800',
};

// Cash/bank heads are money the school holds, so they only make sense as assets.
export const CATEGORY_ACCOUNT_TYPE = 'asset';

// Which kind of account a payment method settles into. Mirrors the backend's
// methodToCashOrBank: only literal cash is cash; every other method (transfer,
// online, cheque, card…) moves through a bank account.
export function methodToCashOrBank(method) {
  return method === 'cash' ? 'cash' : 'bank';
}

/* --------------------------- Chart hierarchy --------------------------- */
// Codes are 4 digits and positional: level-1 roots are seeded (1000/2000/…),
// level-2 groups step by 100 inside their root, level-3 postable accounts step
// by 1 inside their group. Only levels 1–2 are groups; only level 3 can post.
export const ACCOUNT_MAX_LEVEL = 3;
export const ACCOUNT_CODE_REGEX = /^\d{4}$/;

// Range a manual code override must fall inside, given the chosen parent.
// Level-2 children must sit on a hundred boundary; level-3 children on any unit.
export function childCodeRange(parent) {
  const base = Number(parent?.code);
  if (!base) return null;
  if (parent.level === 1) return { from: base + 100, to: base + 900, step: 100 };
  return { from: base + 1, to: base + 99, step: 1 };
}

/* ------------------------------- Journals ------------------------------- */

export const JOURNAL_SOURCES = ['manual', 'opening-balance', 'fee-payment', 'salary', 'fee-void'];

export const JOURNAL_SOURCE_COLORS = {
  manual: 'bg-gray-100 text-gray-700',
  'opening-balance': 'bg-indigo-100 text-indigo-800',
  'fee-payment': 'bg-green-100 text-green-700',
  salary: 'bg-blue-100 text-blue-800',
  'fee-void': 'bg-red-100 text-red-700',
};

export const JOURNAL_STATUSES = ['posted', 'void'];

export const JOURNAL_STATUS_COLORS = {
  posted: 'bg-green-100 text-green-700',
  void: 'bg-black text-white',
};

// Voucher types — every journal entry carries one and gets a type-specific serial
// (JV-, CPV-, BPV-, CRV-, BRV-, CV-). Used for the list column/badge and filter.
export const VOUCHER_TYPES = ['jv', 'cpv', 'bpv', 'crv', 'brv', 'contra'];

export const VOUCHER_TYPE_LABELS = {
  jv: 'Journal',
  cpv: 'Cash Payment',
  bpv: 'Bank Payment',
  crv: 'Cash Receipt',
  brv: 'Bank Receipt',
  contra: 'Contra',
};

export const VOUCHER_TYPE_COLORS = {
  jv: 'bg-gray-100 text-gray-700',
  cpv: 'bg-orange-100 text-orange-800',
  bpv: 'bg-red-100 text-red-700',
  crv: 'bg-green-100 text-green-700',
  brv: 'bg-emerald-100 text-emerald-800',
  contra: 'bg-indigo-100 text-indigo-800',
};

// Auto-post config roles (used by the mapping section, Phase 2).
// Cash and bank are deliberately absent. Those accounts are per-branch (and a
// branch may hold several banks), so they are declared in the Chart of Accounts
// with a cash/bank category and chosen on the transaction itself — there is
// nothing school-wide to configure. See CashBankAccountSelect.
export const MAPPING_ROLES = [
  { role: 'fee-income', label: 'Fee Income', hint: 'Credited on every fee payment' },
  { role: 'salary-expense', label: 'Salary Expense', hint: 'Debited on payslip payments' },
  {
    role: 'opening-balance-equity',
    label: 'Opening Balance Equity',
    hint: 'Contra account for opening balances',
  },
];

/* ------------------------------ Formatters ------------------------------ */

export function formatMoney(n) {
  const num = Number(n) || 0;
  return `₨ ${num.toLocaleString()}`;
}

// Ledger amounts often come as separate debit/credit numbers where one is 0.
// Render the meaningful side and dash the empty one to keep statements readable.
export function formatLedgerAmount(n) {
  const num = Number(n) || 0;
  return num ? num.toLocaleString() : '—';
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

export function toYMD(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// Current YYYY-MM — used for the period-locking screen (Phase 2).
export function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Sum debit/credit columns of a lines array; used to preview balance in the
// manual journal form before the backend enforces it.
export function sumLines(lines = []) {
  return lines.reduce(
    (acc, l) => {
      acc.debit += Number(l.debit) || 0;
      acc.credit += Number(l.credit) || 0;
      return acc;
    },
    { debit: 0, credit: 0 },
  );
}
