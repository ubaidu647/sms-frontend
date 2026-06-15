// Mirror of sms-frontend/src/constants/transport.js. Keep in sync.

export const VEHICLE_TYPES = ['bus', 'van', 'mini-bus', 'car', 'other'];
export const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'hybrid', 'electric'];
export const OWNERSHIP_TYPES = ['owned', 'rented', 'leased'];
export const VEHICLE_STATUSES = ['active', 'maintenance', 'inactive', 'retired'];

export const VEHICLE_STATUS_PILL = {
  active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
  maintenance: { bg: '#fef3c7', fg: '#92400e', label: 'Maintenance' },
  inactive: { bg: '#e5e7eb', fg: '#374151', label: 'Inactive' },
  retired: { bg: '#111827', fg: '#ffffff', label: 'Retired' },
};

export const ROUTE_STATUSES = ['active', 'inactive'];

export const ROUTE_STATUS_PILL = {
  active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
  inactive: { bg: '#e5e7eb', fg: '#374151', label: 'Inactive' },
};

export const ASSIGNMENT_DIRECTIONS = ['both', 'pickup-only', 'drop-only'];

export const ASSIGNMENT_DIRECTION_LABELS = {
  both: 'Pickup & Drop',
  'pickup-only': 'Pickup only',
  'drop-only': 'Drop only',
};

export const ASSIGNMENT_STATUSES = ['active', 'paused', 'cancelled'];

export const ASSIGNMENT_STATUS_PILL = {
  active: { bg: '#dcfce7', fg: '#166534', label: 'Active' },
  paused: { bg: '#fef3c7', fg: '#92400e', label: 'Paused' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b', label: 'Cancelled' },
};

export function titleCase(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toYMD(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
