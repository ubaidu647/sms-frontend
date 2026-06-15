// Mirror of sms-frontend/src/constants/subject.js. Keep in sync.
export const SUBJECT_TYPES = ['mandatory', 'elective', 'co-curricular'];

export const SUBJECT_CATEGORIES = [
  'science',
  'arts',
  'commerce',
  'language',
  'general',
  'religious',
  'physical',
];

export const SUBJECT_STATUSES = ['active', 'inactive'];

export const SUBJECT_CODE_REGEX = /^[A-Za-z0-9-]{2,10}$/;

export const SUBJECT_TYPE_PILL = {
  mandatory: { bg: '#ede9fe', fg: '#5b21b6' },
  elective: { bg: '#fce7f3', fg: '#9d174d' },
  'co-curricular': { bg: '#cffafe', fg: '#155e75' },
};

export const SUBJECT_CATEGORY_PILL = {
  science: { bg: '#dbeafe', fg: '#1e40af' },
  arts: { bg: '#fce7f3', fg: '#9d174d' },
  commerce: { bg: '#fef3c7', fg: '#92400e' },
  language: { bg: '#dcfce7', fg: '#166534' },
  general: { bg: '#e5e7eb', fg: '#374151' },
  religious: { bg: '#fee2e2', fg: '#991b1b' },
  physical: { bg: '#ffedd5', fg: '#9a3412' },
};

export const SUBJECT_STATUS_PILL = {
  active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
  inactive: { bg: '#fee2e2', fg: '#991b1b', label: 'Inactive' },
};

export function titleCase(str) {
  if (!str) return '—';
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('-');
}
