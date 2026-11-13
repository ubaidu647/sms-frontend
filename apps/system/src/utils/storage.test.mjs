import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, formatGB, storageUsage, BYTES_PER_GB } from './storage.js';

test('formatBytes prints MB below a GB and trims GB decimals', () => {
  assert.equal(formatBytes(0), '0 MB');
  assert.equal(formatBytes(350 * 1024 * 1024), '350 MB');
  assert.equal(formatBytes(1.9 * BYTES_PER_GB), '1.9 GB');
  assert.equal(formatBytes(2 * BYTES_PER_GB), '2 GB');
  assert.equal(formatBytes('x'), '-');
  assert.equal(formatGB(0.5), '0.5 GB');
});

test('storageUsage: unlimited, normal, warning and full', () => {
  assert.equal(storageUsage(null), null);
  const unl = storageUsage({ usedBytes: 1024 ** 2, limitGB: null });
  assert.equal(unl.unlimited, true);
  assert.equal(unl.limitText, 'Unlimited');
  const half = storageUsage({ usedBytes: BYTES_PER_GB, limitGB: 2 });
  assert.equal(half.percent, 50);
  assert.equal(half.warn, false);
  const warn = storageUsage({ usedBytes: 1.8 * BYTES_PER_GB, limitGB: 2 });
  assert.equal(warn.warn, true);
  assert.equal(warn.full, false);
  const full = storageUsage({ usedBytes: 3 * BYTES_PER_GB, limitGB: 2 });
  assert.equal(full.full, true);
  assert.equal(full.percent, 100);
  assert.equal(storageUsage({ usedBytes: 0, limitGB: 0 }).warn, false);
});
