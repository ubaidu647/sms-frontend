// Shared bits for the Year-end Promotion screens (labels, colours, cache keys).

export const DECISION_LABELS = {
  promote: 'Promote',
  detain: 'Detain',
  left: 'Left',
  passout: 'Pass out',
};

export const DECISION_COLORS = {
  promote: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  detain: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  left: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  passout: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
};

export const RUN_STATUS_COLORS = {
  prepared: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  undone: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export const RUN_STATUS_LABELS = {
  prepared: 'In progress',
  completed: 'Completed',
  undone: 'Cancelled',
};

export const inputCls =
  'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-teal-500 disabled:opacity-60';

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const secondaryBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const dangerBtn =
  'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export const thCls =
  'text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide';
export const tdCls = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300';

/**
 * After any promotion mutation: the promotion views plus every list that shows
 * classes, sections or students (students move class/section/year, next-year
 * classes and sections are created, old ones deactivated).
 */
export function invalidatePromotionData(queryClient) {
  [
    ['promotion-runs'],
    ['promotion-preview'],
    ['promotion-run'],
    ['promotion-section'],
    ['students'],
    ['students-by-section'],
    ['classes'],
    ['classes-dropdown'],
    ['class-detail'],
    ['sections'],
    ['sections-dropdown'],
  ].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
}

export const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

/** Run counts may come nested (`counts`) or flat on the run. */
export const runCounts = (run) => {
  const c = run?.counts || run || {};
  return {
    students: Number(c.students) || 0,
    processed: Number(c.processed) || 0,
    promote: Number(c.promote) || 0,
    detain: Number(c.detain) || 0,
    left: Number(c.left) || 0,
    passout: Number(c.passout) || 0,
  };
};
