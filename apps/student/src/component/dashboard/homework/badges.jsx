'use client';

// Shared homework badges + submit-state helper, used by both the list and the
// detail page so status colours stay consistent.

// submissionStatus: pending | submitted | late | graded
const SUBMISSION_STYLES = {
  pending: 'bg-[#f5b21c]/15 text-[#b07d00] dark:text-[#f5b21c]',
  submitted: 'bg-[#00918e]/10 text-[#00918e]',
  late: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
  graded: 'bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400',
};

const SUBMISSION_LABELS = {
  pending: 'Pending',
  submitted: 'Submitted',
  late: 'Late',
  graded: 'Graded',
};

export function SubmissionBadge({ status }) {
  const key = status || 'pending';
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        SUBMISSION_STYLES[key] || SUBMISSION_STYLES.pending
      }`}
    >
      {SUBMISSION_LABELS[key] || key}
    </span>
  );
}

const TYPE_LABELS = { document: 'Document', written: 'Written', mcq: 'MCQ' };

export function TypeBadge({ type }) {
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
      {TYPE_LABELS[type] || type}
    </span>
  );
}

// Whether the student may submit, with a human reason when they can't. Mirrors
// the server rules (§4 "UI rules"); the server enforces these too.
export function getSubmitState(hw) {
  if (!hw) return { canSubmit: false, reason: '' };
  if (hw.status !== 'published')
    return { canSubmit: false, reason: 'This homework is not open for submission.' };
  if (hw.submissionStatus === 'graded')
    return { canSubmit: false, reason: 'This has been graded — you can no longer resubmit.' };
  if (hw.isPastDue && !hw.allowLateSubmission)
    return { canSubmit: false, reason: 'The due date has passed and late submission is not allowed.' };
  return { canSubmit: true, reason: '' };
}
