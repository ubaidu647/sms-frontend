// The grade request for one homework submission, or the reason it can't be
// sent. Mirrors the server: marks need the homework's maximum marks to exist
// and stay within them; feedback alone is always allowed. `submittedAt` is the
// submission as the teacher saw it — the server refuses the grade (409) if the
// student has resubmitted since.
export const NO_MAX_MARKS_MESSAGE = 'Set maximum marks on this homework before grading';
export const RESUBMITTED_MESSAGE = 'The student resubmitted — review the new work before grading';

export function buildGradePayload({ marks, feedback, maxMarks, submittedAt }) {
  const hasMarks = marks !== '' && marks != null;
  const note = (feedback ?? '').trim();
  if (!hasMarks && !note) return { error: 'Enter marks and/or feedback.' };
  const payload = { submittedAt };
  if (hasMarks) {
    if (maxMarks == null) return { error: NO_MAX_MARKS_MESSAGE };
    const n = Number(marks);
    if (Number.isNaN(n) || n < 0 || n > maxMarks)
      return { error: `Marks must be between 0 and ${maxMarks}.` };
    payload.marksObtained = n;
  }
  if (note) payload.feedback = note;
  return { payload };
}

// The edit form's assigned date for the update request: omitted when the field
// is empty, so the homework keeps the one it has (never `null`, which the
// server used to store as 1 January 1970).
export function assignedDateForUpdate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

// Mirrors the server: once students have submitted an MCQ homework, its answers
// point at questions and options by position, so questions and options can no
// longer be added or removed. Text, the correct option and marks stay editable.
export const MCQ_SHAPE_LOCKED_MESSAGE =
  'Students have already submitted this homework: questions and options cannot be added or removed. You can still edit question text, the correct option and marks.';

export function mcqShapeChangeError(previous = [], next = []) {
  if (previous.length !== next.length) return MCQ_SHAPE_LOCKED_MESSAGE;
  for (let i = 0; i < previous.length; i++) {
    if ((previous[i]?.options?.length ?? 0) !== (next[i]?.options?.length ?? 0)) {
      return MCQ_SHAPE_LOCKED_MESSAGE;
    }
  }
  return null;
}
