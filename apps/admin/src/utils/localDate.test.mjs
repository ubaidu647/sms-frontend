// Run: node --experimental-detect-module --test <this file>
// Also run under TZ=Asia/Karachi to exercise the UTC+5 early-morning case.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  localYMD,
  localYM,
  addDaysYMD,
  addMonthsYMD,
  daysAgoYMD,
  monthsAgoYMD,
  startOfMonthYMD,
} from './localDate.js';

test('localYMD / localYM use local date parts, zero-padded', () => {
  assert.equal(localYMD(new Date(2026, 0, 5, 0, 30)), '2026-01-05');
  assert.equal(localYMD(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  assert.equal(localYM(new Date(2026, 0, 1, 0, 1)), '2026-01');
  assert.equal(startOfMonthYMD(new Date(2026, 9, 17, 3)), '2026-10-01');
});

test('addDaysYMD crosses month / year / leap boundaries', () => {
  assert.equal(addDaysYMD('2026-10-07', -1), '2026-10-06');
  assert.equal(addDaysYMD('2026-03-01', -1), '2026-02-28');
  assert.equal(addDaysYMD('2024-03-01', -1), '2024-02-29');
  assert.equal(addDaysYMD('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysYMD('bad', 1), '');
});

test('addMonthsYMD clamps to the end of the target month', () => {
  assert.equal(addMonthsYMD('2026-10-07', -1), '2026-09-07');
  assert.equal(addMonthsYMD('2026-03-31', -1), '2026-02-28');
  assert.equal(addMonthsYMD('2024-03-31', -1), '2024-02-29');
  assert.equal(addMonthsYMD('2026-01-15', -2), '2025-11-15');
  assert.equal(addMonthsYMD('2026-11-30', 3), '2027-02-28');
});

test('daysAgoYMD / monthsAgoYMD are relative to the local day', () => {
  const early = new Date(2026, 9, 7, 0, 15); // 00:15 local
  assert.equal(daysAgoYMD(0, early), '2026-10-07');
  assert.equal(daysAgoYMD(30, early), '2026-09-07');
  assert.equal(monthsAgoYMD(1, early), '2026-09-07');
  assert.equal(monthsAgoYMD(2, early), '2026-08-07');
});

test('Asia/Karachi 00:00–05:00 still reads as the local day (not UTC yesterday)', () => {
  if (process.env.TZ === 'Asia/Karachi') {
    // 2026-10-07 02:00 PKT == 2026-10-06T21:00Z
    const d = new Date('2026-10-06T21:00:00Z');
    assert.equal(d.toISOString().slice(0, 10), '2026-10-06'); // the old bug
    assert.equal(localYMD(d), '2026-10-07');
    assert.equal(localYM(new Date('2026-09-30T20:30:00Z')), '2026-10');
    assert.equal(monthsAgoYMD(1, d), '2026-09-07');
    return;
  }
  // Re-run this file in a child process pinned to Asia/Karachi.
  const res = spawnSync(
    process.execPath,
    ['--experimental-detect-module', '--test', fileURLToPath(import.meta.url)],
    { env: { ...process.env, TZ: 'Asia/Karachi' }, encoding: 'utf8' },
  );
  assert.equal(res.status, 0, res.stdout + res.stderr);
});
