// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMarkEntries,
  cleanMarkInput,
  invalidMarkStudents,
  noteEdit,
  releaseSavedEdits,
  savedStudentIds,
  rosterStudents,
} from './marksEntries.js';

const students = [{ _id: 'a' }, { _id: 'b' }, { _id: 'c' }];

test('a blank row is left out, not saved as 0', () => {
  const entries = buildMarkEntries(
    students,
    { a: { theoryObtained: '45' }, b: { theoryObtained: '' }, c: {} },
    { hasTheory: true, hasPractical: false },
  );
  assert.deepEqual(entries, [{ studentId: 'a', theoryObtained: 45 }]);
});

test('a blank half of a split paper is sent as null', () => {
  const entries = buildMarkEntries(
    students.slice(0, 1),
    { a: { theoryObtained: '30', practicalObtained: '' } },
    { hasTheory: true, hasPractical: true },
  );
  assert.deepEqual(entries, [{ studentId: 'a', theoryObtained: 30, practicalObtained: null }]);
});

test('a typed 0 is still a 0, and absent needs no mark', () => {
  const entries = buildMarkEntries(
    students.slice(0, 2),
    { a: { theoryObtained: 0 }, b: { isAbsent: true } },
    { hasTheory: false, hasPractical: false },
  );
  assert.deepEqual(entries, [
    { studentId: 'a', theoryObtained: 0 },
    { studentId: 'b', isAbsent: true },
  ]);
});

test('wiping a saved mark clears it; a never-saved blank row is still left out', () => {
  const entries = buildMarkEntries(
    students,
    { a: { theoryObtained: '' }, b: { theoryObtained: '' }, c: { theoryObtained: '12' } },
    { hasTheory: true, hasPractical: false, saved: new Set(['a', 'c']) },
  );
  assert.deepEqual(entries, [
    { studentId: 'a', clear: true },
    { studentId: 'c', theoryObtained: 12 },
  ]);
});

test('savedStudentIds reads populated and plain student ids', () => {
  assert.deepEqual(
    [...savedStudentIds([{ studentId: { _id: 'a' } }, { studentId: 'b' }])],
    ['a', 'b'],
  );
});

test('cleanMarkInput reads a comma as the point and keeps only one point', () => {
  assert.equal(cleanMarkInput('45,5'), '45.5');
  assert.equal(cleanMarkInput('4.5.6'), '4.56');
  assert.equal(cleanMarkInput('1,2.3'), '1.23');
  assert.equal(cleanMarkInput('a7b-'), '7');
  assert.equal(cleanMarkInput(''), '');
  assert.equal(cleanMarkInput('.'), '.');
});

test('a mark that is not a number is a validation error, not sent', () => {
  const marks = {
    a: { theoryObtained: '.' },
    b: { theoryObtained: '20', practicalObtained: '1.2.3' },
    c: { theoryObtained: '.', isAbsent: true },
  };
  const opts = { hasTheory: true, hasPractical: true };
  assert.deepEqual(
    invalidMarkStudents(students, marks, opts).map((s) => s._id),
    ['a', 'b'],
  );
  assert.throws(() => buildMarkEntries(students, marks, opts));
});

test('valid, blank and absent rows are not invalid', () => {
  assert.deepEqual(
    invalidMarkStudents(
      students,
      { a: { theoryObtained: '4.5' }, b: { theoryObtained: '' }, c: { isAbsent: true } },
      { hasTheory: true, hasPractical: false },
    ),
    [],
  );
});

test('a save releases only the rows it saved, unchanged since', () => {
  const edited = new Map();
  noteEdit(edited, 'a');
  noteEdit(edited, 'b');
  const snapshot = new Map(edited);
  noteEdit(edited, 'b'); // typed again while the save was in flight
  noteEdit(edited, 'c'); // first typed while the save was in flight
  releaseSavedEdits(edited, snapshot);
  assert.deepEqual([...edited.keys()].sort(), ['b', 'c']);
});

test('a reset during the save is not undone by the old snapshot', () => {
  let edited = new Map();
  noteEdit(edited, 'a');
  const snapshot = new Map(edited);
  edited = new Map(); // scope switched
  noteEdit(edited, 'a');
  releaseSavedEdits(edited, snapshot);
  assert.ok(edited.has('a'));
});

test('rosterStudents maps the roster to list-row shape and keeps promoted', () => {
  assert.deepEqual(
    rosterStudents([
      { _id: 'a', name: 'Ali', rollNumber: '1', admissionNumber: 'A-1', promoted: true },
      { _id: 'b', name: 'Sara', rollNumber: '2', admissionNumber: 'A-2', promoted: false },
      null,
      { name: 'no id' },
    ]),
    [
      { _id: 'a', user: { name: 'Ali' }, rollNumber: '1', admissionNumber: 'A-1', promoted: true },
      {
        _id: 'b',
        user: { name: 'Sara' },
        rollNumber: '2',
        admissionNumber: 'A-2',
        promoted: false,
      },
    ],
  );
  assert.deepEqual(rosterStudents(undefined), []);
});

test('teacherMarkSections adds sections the teacher leads to the taught ones', async () => {
  const { teacherMarkSections } = await import('./marksEntries.js');
  const assignments = [
    { section: { _id: 's1', name: 'A' } },
    { section: { _id: 's1', name: 'A' } },
  ];
  const classDoc = {
    classTeacher: 'other',
    sections: [
      { _id: 's1', name: 'A', classTeacher: 'me' },
      { _id: 's2', name: 'B', classTeacher: 'me' },
      { _id: 's3', name: 'C', classTeacher: 'other' },
    ],
  };
  assert.deepEqual(
    teacherMarkSections({ assignments, classDoc, staffId: 'me' }).map((s) => s._id),
    ['s1', 's2'],
  );
  // Leading the class covers every section.
  assert.deepEqual(
    teacherMarkSections({
      assignments: [],
      classDoc: { ...classDoc, classTeacher: 'me' },
      staffId: 'me',
    }).map((s) => s._id),
    ['s1', 's2', 's3'],
  );
  // No class detail (no view-class): only taught sections.
  assert.deepEqual(
    teacherMarkSections({ assignments, classDoc: undefined, staffId: 'me' }).map((s) => s._id),
    ['s1'],
  );
});
