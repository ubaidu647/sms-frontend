// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { TOKEN_STORAGE_KEY, isCrossTabSignOut } from './session.js';

const stored = (accessToken) => JSON.stringify({ state: { accessToken }, version: 2 });
const event = (oldValue, newValue, key = TOKEN_STORAGE_KEY) => ({
  key,
  oldValue,
  newValue,
});

test('isCrossTabSignOut: the marker nulled by a logout', () => {
  assert.equal(isCrossTabSignOut(event(stored('cookie-session'), stored(null))), true);
});

test('isCrossTabSignOut: the entry removed, or storage cleared', () => {
  assert.equal(isCrossTabSignOut(event(stored('cookie-session'), null)), true);
  assert.equal(isCrossTabSignOut(event(null, null, null)), true);
});

test('isCrossTabSignOut: a sign-in or a rewrite of the same state is not', () => {
  const signedIn = stored('cookie-session');
  assert.equal(isCrossTabSignOut(event(stored(null), signedIn)), false);
  assert.equal(isCrossTabSignOut(event(null, signedIn)), false);
  assert.equal(isCrossTabSignOut(event(signedIn, signedIn)), false);
  assert.equal(isCrossTabSignOut(event(stored(null), stored(null))), false);
});

test('isCrossTabSignOut: other keys and unreadable old values are ignored', () => {
  assert.equal(isCrossTabSignOut(event(stored('cookie-session'), null, 'theme-storage')), false);
  assert.equal(isCrossTabSignOut(event('not json', null)), false);
});
