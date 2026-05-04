export const EXAM_TYPES = ['mid-term', 'final', 'monthly', 'weekly', 'mock', 'pre-board', 'other'];

export const EXAM_STATUSES = ['planned', 'in-progress', 'completed', 'published'];

export const SUBJECT_STATUSES = ['planned', 'completed', 'graded'];

export const GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'F'];

export const EXAM_STATUS_COLORS = {
  planned: 'bg-gray-100 text-gray-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  published: 'bg-purple-100 text-purple-700',
};

export const SUBJECT_STATUS_COLORS = {
  planned: 'bg-gray-100 text-gray-700',
  completed: 'bg-blue-100 text-blue-700',
  graded: 'bg-green-100 text-green-700',
};

export const GRADE_COLORS = {
  'A+': 'bg-emerald-100 text-emerald-700',
  A: 'bg-green-100 text-green-700',
  'B+': 'bg-lime-100 text-lime-700',
  B: 'bg-yellow-100 text-yellow-700',
  'C+': 'bg-amber-100 text-amber-700',
  C: 'bg-orange-100 text-orange-700',
  F: 'bg-red-100 text-red-700',
};

export function gradeFromPercentage(pct) {
  if (pct == null || Number.isNaN(pct)) return '—';
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C+';
  if (pct >= 40) return 'C';
  return 'F';
}

export function currentAcademicYear() {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function toYMD(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
