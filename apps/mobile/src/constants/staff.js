export const STAFF_TYPES = ['teaching', 'non-teaching'];
export const EMPLOYMENT_TYPES = ['permanent', 'contract', 'part-time', 'visiting'];
export const GENDERS = ['male', 'female', 'other'];
export const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const ACTIVE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Blocked' },
];

// When a self-user is editing their own profile, only these scalar fields
// are sent to PUT /staff/:id. Mirrors the web's SELF_ALLOWED_SCALARS.
export const SELF_ALLOWED_SCALARS = [
  'name',
  'phone',
  'dob',
  'cnic',
  'bloodGroup',
  'qualification',
  'maritalStatus',
];

export const STAFF_TYPE_PILL = {
  teaching: { bg: '#ccfbf1', fg: '#0f766e' },
  'non-teaching': { bg: '#fef9c3', fg: '#854d0e' },
};

export const EMPLOYMENT_PILL = { bg: '#dbeafe', fg: '#1d4ed8' };

export const STATUS_PILL = {
  active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
  blocked: { bg: '#fee2e2', fg: '#991b1b', label: 'Blocked' },
};

export function titleCase(str) {
  if (!str) return '—';
  return str
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}
