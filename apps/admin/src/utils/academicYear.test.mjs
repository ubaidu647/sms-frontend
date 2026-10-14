// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseStartMonth,
  academicYearStartMonth,
  currentAcademicYear,
  nextAcademicYear,
  previousAcademicYear,
} from './academicYear.js';

test('April start: Apr–Dec belong to the year starting this calendar year', () => {
  assert.equal(currentAcademicYear(new Date(2026, 3, 1, 0, 5), 4), '2026-2027');
  assert.equal(currentAcademicYear(new Date(2026, 9, 9), 4), '2026-2027');
  assert.equal(currentAcademicYear(new Date(2026, 11, 31, 23, 59), 4), '2026-2027');
});

test('April start: Jan–Mar belong to the previous start year', () => {
  assert.equal(currentAcademicYear(new Date(2027, 0, 1, 0, 1), 4), '2026-2027');
  assert.equal(currentAcademicYear(new Date(2027, 1, 28), 4), '2026-2027');
  assert.equal(currentAcademicYear(new Date(2027, 2, 31, 23, 59), 4), '2026-2027');
});

test('other start months', () => {
  assert.equal(currentAcademicYear(new Date(2026, 0, 15), 1), '2026-2027');
  assert.equal(currentAcademicYear(new Date(2026, 7, 31), 9), '2025-2026');
  assert.equal(currentAcademicYear(new Date(2026, 8, 1), 9), '2026-2027');
});

test('parseStartMonth falls back to April on bad input', () => {
  assert.equal(parseStartMonth('4'), 4);
  assert.equal(parseStartMonth('9'), 9);
  assert.equal(parseStartMonth(undefined), 4);
  assert.equal(parseStartMonth(''), 4);
  assert.equal(parseStartMonth('13'), 4);
  assert.equal(parseStartMonth('0'), 4);
  assert.equal(parseStartMonth('abc'), 4);
  assert.equal(parseStartMonth('4.5'), 4);
});

test('start month is read from NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH', () => {
  const prev = process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
  try {
    delete process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
    assert.equal(academicYearStartMonth(), 4);
    assert.equal(currentAcademicYear(new Date(2027, 2, 1)), '2026-2027');
    process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH = '1';
    assert.equal(academicYearStartMonth(), 1);
    assert.equal(currentAcademicYear(new Date(2027, 2, 1)), '2027-2028');
  } finally {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
    else process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH = prev;
  }
});

test('next / previous academic year', () => {
  assert.equal(nextAcademicYear('2025-2026'), '2026-2027');
  assert.equal(previousAcademicYear('2025-2026'), '2024-2025');
  assert.equal(nextAcademicYear('2025'), '');
  assert.equal(nextAcademicYear(null), '');
  assert.equal(previousAcademicYear('x'), '');
});
