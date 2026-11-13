// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { errorMessage, errorStatus, retryUnless4xx } from './queryError.js';

const refused = {
  message: 'Request failed with status code 403',
  response: { status: 403, data: { message: 'Access denied — missing permission: view-student' } },
};

test("a raw axios 403 shows the server's message, not axios's", () => {
  assert.equal(errorMessage(refused), 'Access denied — missing permission: view-student');
  assert.equal(errorStatus(refused), 403);
});

test('errors already rethrown as plain Errors keep their message and status', () => {
  const err = Object.assign(new Error('Access denied'), { status: 403 });
  assert.equal(errorMessage(err), 'Access denied');
  assert.equal(errorStatus(err), 403);
});

test('an error with no message falls back', () => {
  assert.equal(errorMessage({}, 'Could not load the options'), 'Could not load the options');
  assert.equal(errorMessage(undefined), 'Something went wrong');
});

test('a 4xx is not retried; a network or server failure is, twice', () => {
  assert.equal(retryUnless4xx(0, refused), false);
  assert.equal(retryUnless4xx(0, { status: 404 }), false);
  assert.equal(retryUnless4xx(0, new Error('Network Error')), true);
  assert.equal(retryUnless4xx(1, { status: 500 }), true);
  assert.equal(retryUnless4xx(2, { status: 500 }), false);
});
