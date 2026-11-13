// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { waitForPrintAssets } from './printReady.js';

const later = (ms, log, name) =>
  new Promise((resolve) =>
    setTimeout(() => {
      log.push(name);
      resolve();
    }, ms),
  );

test('waitForPrintAssets: waits for the fonts and every image', async () => {
  const log = [];
  await waitForPrintAssets({
    fonts: { ready: later(5, log, 'font') },
    images: [{ decode: () => later(10, log, 'img') }],
  });
  assert.deepEqual(log, ['font', 'img']);
});

test('waitForPrintAssets: a broken image does not cut the wait short or reject', async () => {
  const log = [];
  await waitForPrintAssets({
    images: [
      { decode: () => Promise.reject(new Error('broken')) },
      { decode: () => later(10, log, 'good') },
    ],
  });
  assert.deepEqual(log, ['good']);
});

test('waitForPrintAssets: an asset that never settles hits the timeout', async () => {
  const start = Date.now();
  await waitForPrintAssets({ images: [{ decode: () => new Promise(() => {}) }] }, 20);
  assert.ok(Date.now() - start < 1000);
});

test('waitForPrintAssets: no fonts API and no images is fine', async () => {
  await waitForPrintAssets({});
});
