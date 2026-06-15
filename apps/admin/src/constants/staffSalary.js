export const COMPONENT_TYPES = ['fixed', 'percent'];

export const PAYSLIP_STATUSES = ['draft', 'finalized', 'paid', 'cancelled'];

export const PAYSLIP_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  finalized: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export const PAYMENT_METHODS = ['cash', 'bank-transfer', 'cheque', 'online', 'other'];

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  'bank-transfer': 'Bank Transfer',
  cheque: 'Cheque',
  online: 'Online',
  other: 'Other',
};

export const REFERENCE_REQUIRED_METHODS = ['bank-transfer', 'cheque', 'online'];

export const STAFF_TYPES = ['teaching', 'non-teaching'];

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function previousMonth() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(ym) {
  if (!ym) return '—';
  const [y, m] = String(ym).split('-');
  if (!y || !m) return ym;
  const d = new Date(Number(y), Number(m) - 1, 1);
  if (Number.isNaN(d.getTime())) return ym;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatMoney(n, currency = 'PKR') {
  const num = Number(n) || 0;
  const sym = currency === 'PKR' ? '₨' : currency;
  return `${sym} ${num.toLocaleString()}`;
}

export function toYMD(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
