export const ATTENDANCE_STATUSES = [
  'present',
  'absent',
  'late',
  'half-day',
  'leave',
  'holiday',
];

export const STATUS_PILL = {
  present: { bg: '#dcfce7', fg: '#166534', solid: '#10b981', short: 'P', label: 'Present', icon: 'check' },
  absent: { bg: '#fee2e2', fg: '#991b1b', solid: '#ef4444', short: 'A', label: 'Absent', icon: 'x' },
  late: { bg: '#fef3c7', fg: '#92400e', solid: '#f59e0b', short: 'L', label: 'Late', icon: 'clock' },
  'half-day': { bg: '#fed7aa', fg: '#9a3412', solid: '#ea580c', short: 'H', label: 'Half', icon: 'sunset' },
  leave: { bg: '#e0e7ff', fg: '#3730a3', solid: '#6366f1', short: 'Lv', label: 'Leave', icon: 'log-out' },
  holiday: { bg: '#cffafe', fg: '#155e75', solid: '#06b6d4', short: 'Ho', label: 'Holiday', icon: 'sun' },
  excused: { bg: '#e9d5ff', fg: '#6b21a8', solid: '#a855f7', short: 'E', label: 'Excused', icon: 'shield' },
};

export const PERCENTAGE_COLOR = (p) => {
  if (p == null) return { fg: '#6b7280', bg: '#e5e7eb' };
  if (p >= 90) return { fg: '#166534', bg: '#dcfce7' };
  if (p >= 75) return { fg: '#0f766e', bg: '#ccfbf1' };
  if (p >= 60) return { fg: '#92400e', bg: '#fef3c7' };
  return { fg: '#991b1b', bg: '#fee2e2' };
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export function startOfWeek(dateISO) {
  const d = new Date(dateISO);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(dateISO, n) {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekDates(weekStartISO) {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(weekStartISO, i));
}

export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function fmtDayShort(dateISO) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'][(d.getDay() + 6) % 7];
}

export function fmtDayNum(dateISO) {
  if (!dateISO) return '';
  return String(new Date(dateISO).getDate());
}
