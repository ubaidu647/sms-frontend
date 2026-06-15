// Mirror of sms-frontend/src/constants/announcement.js. Keep in sync.
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
  notice: 'volume-2',
  event: 'gift',
  holiday: 'sun',
  exam: 'edit-3',
  urgent: 'alert-triangle',
  general: 'file-text',
};

export const PRIORITY_PILL = {
  low: { bg: '#f3f4f6', fg: '#374151', solid: '#6b7280', label: 'Low' },
  normal: { bg: '#dbeafe', fg: '#1e40af', solid: '#2563eb', label: 'Normal' },
  high: { bg: '#fef3c7', fg: '#92400e', solid: '#f59e0b', label: 'High' },
  urgent: { bg: '#fee2e2', fg: '#991b1b', solid: '#dc2626', label: 'Urgent' },
};

export const STATUS_PILL = {
  draft: { bg: '#f3f4f6', fg: '#374151', label: 'Draft' },
  published: { bg: '#dcfce7', fg: '#166534', label: 'Published' },
  archived: { bg: '#ede9fe', fg: '#5b21b6', label: 'Archived' },
};

export const TYPE_PILL = {
  notice: { bg: '#dbeafe', fg: '#1e40af', label: 'Notice' },
  event: { bg: '#fce7f3', fg: '#9d174d', label: 'Event' },
  holiday: { bg: '#d1fae5', fg: '#065f46', label: 'Holiday' },
  exam: { bg: '#eef2ff', fg: '#3730a3', label: 'Exam' },
  urgent: { bg: '#fee2e2', fg: '#991b1b', label: 'Urgent' },
  general: { bg: '#f3f4f6', fg: '#374151', label: 'General' },
};

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

export function titleCase(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function validateFile(file) {
  if (!file) return null;
  if (file.mimeType && !ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    return 'File type not allowed (jpg, png, webp, pdf only)';
  }
  if (file.size && file.size > MAX_FILE_SIZE) {
    return 'File too large (max 5MB)';
  }
  return null;
}
