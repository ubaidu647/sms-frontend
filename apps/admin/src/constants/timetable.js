export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const PERIOD_TYPES = ['lesson', 'break', 'assembly', 'sports', 'library', 'other'];

export const SLOT_TYPES = [
  'lesson',
  'break',
  'assembly',
  'sports',
  'library',
  'free',
  'exam',
  'other',
];

export const SLOT_TYPE_COLORS = {
  lesson: 'bg-teal-100 text-teal-800',
  break: 'bg-amber-100 text-amber-800',
  assembly: 'bg-purple-100 text-purple-800',
  sports: 'bg-blue-100 text-blue-800',
  library: 'bg-indigo-100 text-indigo-800',
  free: 'bg-gray-100 text-gray-700',
  exam: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-700',
};

export const PERIOD_TYPE_COLORS = {
  lesson: 'bg-teal-50 text-teal-700',
  break: 'bg-amber-50 text-amber-700',
  assembly: 'bg-purple-50 text-purple-700',
  sports: 'bg-blue-50 text-blue-700',
  library: 'bg-indigo-50 text-indigo-700',
  other: 'bg-gray-50 text-gray-600',
};

export function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export function addMinutes(hhmm, minutes) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function isHHmm(v) {
  return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v);
}
