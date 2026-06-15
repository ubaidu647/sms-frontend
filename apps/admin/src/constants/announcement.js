export const ANNOUNCEMENT_TYPES = ['notice', 'event', 'holiday', 'exam', 'urgent', 'general'];

export const ANNOUNCEMENT_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export const ANNOUNCEMENT_STATUSES = ['draft', 'published', 'archived'];

export const ANNOUNCEMENT_SCOPES = ['school', 'branch', 'class', 'section', 'staff'];

export const TARGET_USER_TYPES = ['staff', 'student', 'parent'];

export const SCOPE_LABELS = {
  school: 'Whole School',
  branch: 'Specific Branches',
  class: 'Specific Classes',
  section: 'Specific Sections',
  staff: 'Specific Staff',
};

export const TYPE_ICONS = {
  notice: '📢',
  event: '🎉',
  holiday: '🏖️',
  exam: '📝',
  urgent: '⚠️',
  general: '📰',
};

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-800',
  urgent: 'bg-red-100 text-red-700',
};

export const PRIORITY_BORDERS = {
  low: 'border-l-gray-400',
  normal: 'border-l-blue-500',
  high: 'border-l-amber-500',
  urgent: 'border-l-red-500',
};

export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-purple-100 text-purple-700',
};

export const TYPE_COLORS = {
  notice: 'bg-blue-100 text-blue-700',
  event: 'bg-pink-100 text-pink-700',
  holiday: 'bg-emerald-100 text-emerald-700',
  exam: 'bg-indigo-100 text-indigo-700',
  urgent: 'bg-red-100 text-red-700',
  general: 'bg-gray-100 text-gray-700',
};

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

export function formatBytes(n) {
  const num = Number(n) || 0;
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / 1024 / 1024).toFixed(2)} MB`;
}

export function validateFile(file) {
  if (!file) return null;
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'File type not allowed (jpg, png, webp, pdf only)';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large (max 5MB)';
  }
  return null;
}
