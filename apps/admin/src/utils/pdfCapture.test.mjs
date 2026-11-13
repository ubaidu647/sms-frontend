// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PDF_CAPTURE_OPTIONS, forceLightTheme } from './pdfCapture.js';

const docWith = (...classes) => {
  const set = new Set(classes);
  return { set, documentElement: { classList: { remove: (c) => set.delete(c) } } };
};

test('forceLightTheme: drops only the dark class', () => {
  const doc = docWith('dark', 'font-sans');
  forceLightTheme(doc);
  assert.deepEqual([...doc.set], ['font-sans']);
});

test('forceLightTheme: a light page stays as it is', () => {
  const doc = docWith('font-sans');
  forceLightTheme(doc);
  assert.deepEqual([...doc.set], ['font-sans']);
});

test('PDF_CAPTURE_OPTIONS: white paper, light clone', () => {
  assert.equal(PDF_CAPTURE_OPTIONS.backgroundColor, '#ffffff');
  assert.equal(PDF_CAPTURE_OPTIONS.onclone, forceLightTheme);
});
