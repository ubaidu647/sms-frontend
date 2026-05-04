export const STAFF_ATTENDANCE_STATUSES = [
  'present',
  'absent',
  'late',
  'leave',
  'half-day',
  'holiday',
];

export const STAFF_LEAVE_TYPES = ['casual', 'sick', 'annual', 'unpaid', 'other'];

export const STAFF_TYPES = ['teaching', 'non-teaching'];

export const STATUS_CONFIG = [
  {
    value: 'present',
    label: 'Present',
    color: 'bg-green-100 text-green-800 border-green-300',
    activeColor: 'bg-green-600 text-white border-green-700',
  },
  {
    value: 'absent',
    label: 'Absent',
    color: 'bg-red-100 text-red-800 border-red-300',
    activeColor: 'bg-red-600 text-white border-red-700',
  },
  {
    value: 'late',
    label: 'Late',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    activeColor: 'bg-yellow-500 text-white border-yellow-600',
  },
  {
    value: 'half-day',
    label: 'Half-day',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    activeColor: 'bg-orange-500 text-white border-orange-600',
  },
  {
    value: 'leave',
    label: 'Leave',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    activeColor: 'bg-blue-600 text-white border-blue-700',
  },
  {
    value: 'holiday',
    label: 'Holiday',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    activeColor: 'bg-gray-600 text-white border-gray-700',
  },
];

export function formatWorkedMinutes(mins) {
  if (mins == null) return '—';
  const m = Number(mins);
  if (!Number.isFinite(m) || m <= 0) return '0h';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}
