// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGradePayload,
  assignedDateForUpdate,
  NO_MAX_MARKS_MESSAGE,
} from './homeworkGrading.js';

const AT = '2026-03-01T10:00:00.000Z';

test('a grade carries the submission version the teacher saw', () => {
  const { payload } = buildGradePayload({
    marks: '7',
    feedback: ' good ',
    maxMarks: 10,
    submittedAt: AT,
  });
  assert.deepEqual(payload, { submittedAt: AT, marksObtained: 7, feedback: 'good' });
});

test('marks need maximum marks; feedback alone does not', () => {
  assert.equal(
    buildGradePayload({ marks: 5, maxMarks: null, submittedAt: AT }).error,
    NO_MAX_MARKS_MESSAGE,
  );
  assert.deepEqual(
    buildGradePayload({ marks: '', feedback: 'see me', maxMarks: undefined, submittedAt: AT })
      .payload,
    { submittedAt: AT, feedback: 'see me' },
  );
});

test('marks stay within 0..maxMarks and something must be entered', () => {
  assert.match(buildGradePayload({ marks: 11, maxMarks: 10 }).error, /between 0 and 10/);
  assert.match(buildGradePayload({ marks: -1, maxMarks: 10 }).error, /between 0 and 10/);
  assert.match(buildGradePayload({ marks: '', feedback: '  ' }).error, /marks and\/or feedback/);
});

test('an empty assigned date is left out of the update', () => {
  assert.equal(assignedDateForUpdate(''), undefined);
  assert.equal(assignedDateForUpdate(null), undefined);
  assert.equal(assignedDateForUpdate('not a date'), undefined);
  assert.equal(
    assignedDateForUpdate('2026-01-05T09:00'),
    new Date('2026-01-05T09:00').toISOString(),
  );
});
