export const FEE_FREQUENCIES = ['monthly', 'one-time', 'annual', 'quarterly'];

export const PAYMENT_METHODS = ['cash', 'bank-transfer', 'online', 'cheque', 'card', 'other'];

export const VOUCHER_STATUSES = ['unpaid', 'partial', 'paid', 'overdue', 'void'];

export const VOUCHER_STATUS_COLORS = {
  unpaid: 'bg-gray-100 text-gray-700',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-black text-white',
};

export const PAYMENT_METHOD_COLORS = {
  cash: 'bg-emerald-100 text-emerald-800',
  'bank-transfer': 'bg-blue-100 text-blue-800',
  online: 'bg-indigo-100 text-indigo-800',
  cheque: 'bg-purple-100 text-purple-800',
  card: 'bg-pink-100 text-pink-800',
  other: 'bg-gray-100 text-gray-700',
};

export const REFERENCE_REQUIRED_METHODS = ['bank-transfer', 'cheque', 'online'];

export function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function formatMonth(ym) {
  if (!ym) return '—';
  const [y, m] = String(ym).split('-');
  if (!y || !m) return ym;
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return ym;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export function formatMoney(n) {
  const num = Number(n) || 0;
  return `₨ ${num.toLocaleString()}`;
}

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];
