export const VEHICLE_TYPES = ['bus', 'van', 'mini-bus', 'car', 'other'];

export const FUEL_TYPES = ['petrol', 'diesel', 'cng', 'hybrid', 'electric'];

export const OWNERSHIP_TYPES = ['owned', 'rented', 'leased'];

export const VEHICLE_STATUSES = ['active', 'maintenance', 'inactive', 'retired'];

export const VEHICLE_STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  maintenance: 'bg-amber-100 text-amber-800',
  inactive: 'bg-gray-200 text-gray-700',
  retired: 'bg-black text-white',
};

export const ROUTE_STATUSES = ['active', 'inactive'];

export const ROUTE_STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-200 text-gray-700',
};

export const ASSIGNMENT_DIRECTIONS = ['both', 'pickup-only', 'drop-only'];

export const ASSIGNMENT_DIRECTION_LABELS = {
  both: 'Pickup & Drop',
  'pickup-only': 'Pickup only',
  'drop-only': 'Drop only',
};

export const ASSIGNMENT_STATUSES = ['active', 'paused', 'cancelled'];

export const ASSIGNMENT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-700',
};
