// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  parseStartMonth,
  academicYearStartMonth,
  defaultAcademicYearStartMonth,
  schoolAcademicYearStartMonth,
  setSchoolAcademicYearStartMonth,
  setAcademicYearUser,
  academicYearUser,
  clearAcademicYearStartMonth,
  startMonthFromSettings,
  monthName,
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

test("the school's own start month wins over the env, and clears back to it", () => {
  const prev = process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
  try {
    process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH = '9';
    setSchoolAcademicYearStartMonth(8);
    assert.equal(schoolAcademicYearStartMonth(), 8);
    assert.equal(academicYearStartMonth(), 8);
    assert.equal(defaultAcademicYearStartMonth(), 9);
    // 6 July 2026: before an August start, so still 2025-2026
    assert.equal(currentAcademicYear(new Date(2026, 6, 6)), '2025-2026');
    assert.equal(currentAcademicYear(new Date(2026, 7, 1)), '2026-2027');

    setSchoolAcademicYearStartMonth(null);
    assert.equal(schoolAcademicYearStartMonth(), null);
    assert.equal(academicYearStartMonth(), 9);

    delete process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
    assert.equal(academicYearStartMonth(), 4);
    assert.equal(currentAcademicYear(new Date(2026, 6, 6)), '2026-2027');
  } finally {
    setSchoolAcademicYearStartMonth(null);
    if (prev === undefined) delete process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
    else process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH = prev;
  }
});

test('an invalid school month is treated as "no setting"', () => {
  for (const bad of [0, 13, 4.5, 'abc', '', undefined]) {
    setSchoolAcademicYearStartMonth(bad);
    assert.equal(schoolAcademicYearStartMonth(), null);
  }
  setSchoolAcademicYearStartMonth('8');
  assert.equal(schoolAcademicYearStartMonth(), 8);
  setSchoolAcademicYearStartMonth(null);
});

test('monthName', () => {
  assert.equal(monthName(1), 'January');
  assert.equal(monthName(8), 'August');
  assert.equal(monthName(13), '');
  assert.equal(monthName(null), '');
});

function fakeLocalStorage() {
  const m = new Map();
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

function withWindow(fn) {
  const prevWindow = globalThis.window;
  const prevEnv = process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
  const store = fakeLocalStorage();
  globalThis.window = { localStorage: store };
  try {
    delete process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
    clearAcademicYearStartMonth();
    fn(store);
  } finally {
    clearAcademicYearStartMonth();
    if (prevWindow === undefined) delete globalThis.window;
    else globalThis.window = prevWindow;
    if (prevEnv === undefined) delete process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH;
    else process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH = prevEnv;
  }
}

test('startMonthFromSettings prefers the effective month the API uses', () => {
  assert.equal(
    startMonthFromSettings({ academicYearStartMonth: null, effectiveAcademicYearStartMonth: 9 }),
    9,
  );
  assert.equal(
    startMonthFromSettings({ academicYearStartMonth: 8, effectiveAcademicYearStartMonth: 8 }),
    8,
  );
  // older API without the effective field: the own setting, else null (env)
  assert.equal(startMonthFromSettings({ academicYearStartMonth: 7 }), 7);
  assert.equal(startMonthFromSettings({ academicYearStartMonth: null }), null);
  assert.equal(startMonthFromSettings(undefined), null);
  assert.equal(startMonthFromSettings({ effectiveAcademicYearStartMonth: 13 }), null);
});

test('the remembered month is keyed by user', () => {
  withWindow((store) => {
    setAcademicYearUser('u1');
    setSchoolAcademicYearStartMonth(8);
    assert.equal(store.getItem('sms-academic-year-start-month:u1'), '8');

    // another user on the same browser does not inherit it
    setAcademicYearUser('u2');
    assert.equal(schoolAcademicYearStartMonth(), null);
    assert.equal(academicYearStartMonth(), 4);
    setSchoolAcademicYearStartMonth(1);

    // back to u1 (e.g. a reload before the settings request answers)
    setAcademicYearUser('u1');
    assert.equal(schoolAcademicYearStartMonth(), 8);
  });
});

test('sign-out clears the in-memory and every remembered month', () => {
  withWindow((store) => {
    store.setItem('sms-academic-year-start-month', '9'); // legacy un-keyed entry
    store.setItem('unrelated', 'x');
    setAcademicYearUser('u1');
    setSchoolAcademicYearStartMonth(8);
    setAcademicYearUser('u2');
    setSchoolAcademicYearStartMonth(1);

    clearAcademicYearStartMonth();
    assert.equal(academicYearUser(), null);
    assert.equal(schoolAcademicYearStartMonth(), null);
    assert.equal(academicYearStartMonth(), 4);
    assert.deepEqual([...store._map.keys()], ['unrelated']);

    // next user, settings request slow/failed: env default, not the old month
    process.env.NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH = '6';
    setAcademicYearUser('u3');
    assert.equal(academicYearStartMonth(), 6);
  });
});
