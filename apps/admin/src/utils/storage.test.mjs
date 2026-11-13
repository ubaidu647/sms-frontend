import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BYTES_PER_GB,
  STORAGE_FULL_FALLBACK,
  formatBytes,
  formatGB,
  isStorageFull,
  storageFullMessage,
  storageUsage,
} from './storage.js';

test('formatBytes prints MB below a GB and trims GB decimals', () => {
  assert.equal(formatBytes(0), '0 MB');
  assert.equal(formatBytes(350 * 1024 * 1024), '350 MB');
  assert.equal(formatBytes(1.9 * BYTES_PER_GB), '1.9 GB');
  assert.equal(formatBytes(null), '0 MB');
  assert.equal(formatBytes('x'), '-');
  assert.equal(formatGB(2), '2 GB');
});

test('storageUsage warns at 90% and caps the bar at 100%', () => {
  assert.equal(storageUsage(undefined), null);
  assert.equal(storageUsage({ usedBytes: 5, limitGB: null }).unlimited, true);
  assert.equal(storageUsage({ usedBytes: 5, limitGB: null }).limitText, null);
  const u = storageUsage({ usedBytes: 0.5 * BYTES_PER_GB, limitGB: 2 });
  assert.equal(u.percent, 25);
  assert.equal(u.warn, false);
  assert.equal(storageUsage({ usedBytes: 0.9 * 2 * BYTES_PER_GB, limitGB: 2 }).warn, true);
  const over = storageUsage({ usedBytes: 5 * BYTES_PER_GB, limitGB: 2 });
  assert.equal(over.percent, 100);
  assert.equal(over.full, true);
});

test('storage-full refusals are recognised by code, on axios or api.js errors', () => {
  const axiosErr = {
    response: {
      status: 403,
      data: { code: 'STORAGE_LIMIT_REACHED', message: 'Storage full: 1.9 GB of 2 GB used.' },
    },
  };
  assert.equal(isStorageFull(axiosErr), true);
  assert.equal(storageFullMessage(axiosErr), 'Storage full: 1.9 GB of 2 GB used.');
  const apiErr = Object.assign(new Error(''), { code: 'STORAGE_LIMIT_REACHED' });
  assert.equal(storageFullMessage(apiErr), STORAGE_FULL_FALLBACK);
  assert.equal(storageFullMessage(new Error('nope')), null);
  assert.equal(isStorageFull({ response: { data: { code: 'PLAN_FEATURE_DISABLED' } } }), false);
});
