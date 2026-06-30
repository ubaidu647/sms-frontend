// Shared homework enums + display styles (admin/teacher side).

export const SUBMISSION_TYPES = [
  { value: 'document', label: 'Document upload' },
  { value: 'written', label: 'Written answer' },
  { value: 'mcq', label: 'Multiple choice (MCQ)' },
];

export const SUBMISSION_TYPE_LABELS = {
  document: 'Document',
  written: 'Written',
  mcq: 'MCQ',
};

// Lifecycle: draft → published → closed (read-only) | archived (hidden).
export const HOMEWORK_STATUSES = ['draft', 'published', 'closed', 'archived'];

export const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  published: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400',
  closed: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400',
  archived: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

// Submission row status (teacher view of student work).
export const SUBMISSION_STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  submitted: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400',
  late: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  graded: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400',
};
