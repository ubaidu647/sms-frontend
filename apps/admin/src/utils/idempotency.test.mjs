// Run: node --experimental-detect-module --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  KEY_REUSED_MESSAGE,
  KEY_VOIDED_MESSAGE,
  REPLAY_MESSAGE,
  isKeyReusedConflict,
  isKeyVoidedConflict,
  isReplayMessage,
  holdKey,
  isUnknownOutcome,
  keyForTarget,
  newIdempotencyKey,
  releaseKey,
  spentKeyMessage,
  successMessage,
} from './idempotency.js';

const err = (status, message) => Object.assign(new Error(message), { status });

test('spentKeyMessage: covers journal entries and reversed payslip payments', () => {
  assert.equal(spentKeyMessage(err(409, 'This journal entry was voided')), KEY_VOIDED_MESSAGE);
  assert.equal(spentKeyMessage(err(409, 'This payment was reversed')), KEY_VOIDED_MESSAGE);
  assert.equal(
    spentKeyMessage(err(409, 'Idempotency-Key was already used for a different payment')),
    KEY_REUSED_MESSAGE,
  );
});

test('newIdempotencyKey: uuid-shaped and unique', () => {
  const a = newIdempotencyKey();
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(a, newIdempotencyKey());
});

test('isKeyReusedConflict: only the 409 about a different request', () => {
  assert.equal(
    isKeyReusedConflict(err(409, 'Idempotency-Key was already used for a different request')),
    true,
  );
  assert.equal(
    isKeyReusedConflict(err(409, 'Idempotency-Key was already used for a different payment')),
    true,
  );
  assert.equal(isKeyReusedConflict(err(409, 'This sale was voided')), false);
  assert.equal(
    isKeyReusedConflict(err(400, 'Idempotency-Key was used for a different request')),
    false,
  );
  assert.equal(isKeyReusedConflict(err(undefined, 'Network Error')), false);
  assert.equal(isKeyReusedConflict(null), false);
  assert.ok(KEY_REUSED_MESSAGE.includes('already recorded'));
});

test('isKeyVoidedConflict: the 409 for a key matching a since-voided document', () => {
  for (const m of [
    'This sale was voided',
    'This purchase was voided',
    'This supplier payment was voided',
    'This payment was voided',
  ]) {
    assert.equal(isKeyVoidedConflict(err(409, m)), true, m);
  }
  assert.equal(isKeyVoidedConflict(err(400, 'This sale was voided')), false);
  assert.equal(isKeyVoidedConflict(err(409, 'Insufficient stock')), false);
  assert.equal(
    isKeyVoidedConflict(err(409, 'Idempotency-Key was already used for a different request')),
    false,
  );
  assert.equal(isKeyVoidedConflict(undefined), false);
  assert.ok(KEY_VOIDED_MESSAGE.includes('voided'));
});

test('spentKeyMessage: message for either spent-key 409, null otherwise', () => {
  assert.equal(
    spentKeyMessage(err(409, 'Idempotency-Key was already used for a different request')),
    KEY_REUSED_MESSAGE,
  );
  assert.equal(spentKeyMessage(err(409, 'This purchase was voided')), KEY_VOIDED_MESSAGE);
  assert.equal(spentKeyMessage(err(409, 'Not enough stock')), null);
  assert.equal(spentKeyMessage(err(undefined, 'Network Error')), null);
  assert.equal(spentKeyMessage(null), null);
});

test('successMessage: friendly text for a replay, server text otherwise', () => {
  assert.equal(
    successMessage({ message: 'Sale already recorded for this Idempotency-Key' }, 'x'),
    REPLAY_MESSAGE,
  );
  assert.equal(successMessage({ message: 'Purchase posted' }, 'x'), 'Purchase posted');
  assert.equal(successMessage({}, 'Fallback'), 'Fallback');
  assert.equal(successMessage(undefined, 'Fallback'), 'Fallback');
  assert.equal(isReplayMessage('Payment recorded'), false);
});

test('isUnknownOutcome: no response or a 5xx may have been recorded; a 4xx was refused', () => {
  assert.equal(isUnknownOutcome(err(undefined, 'Network Error')), true);
  assert.equal(isUnknownOutcome(err(500, 'Internal Server Error')), true);
  assert.equal(isUnknownOutcome(err(504, 'Gateway Timeout')), true);
  assert.equal(isUnknownOutcome(err(400, 'Amount exceeds balance')), false);
  assert.equal(isUnknownOutcome(err(403, 'Forbidden')), false);
  assert.equal(isUnknownOutcome(err(409, 'Conflict')), false);
  assert.equal(isUnknownOutcome(undefined), true);
});

test('keyForTarget: a fresh key per call while nothing is held', () => {
  assert.notEqual(keyForTarget('t:fresh'), keyForTarget('t:fresh'));
});

test('holdKey: the same target gets the held key on every reopen', () => {
  holdKey('t:held', 'key-1');
  assert.equal(keyForTarget('t:held'), 'key-1');
  assert.equal(keyForTarget('t:held'), 'key-1');
  releaseKey('t:held');
});

test('holdKey: another target is not affected', () => {
  holdKey('t:a', 'key-a');
  assert.notEqual(keyForTarget('t:b'), 'key-a');
  releaseKey('t:a');
});

test('releaseKey: the next open is a new key; an unknown target is a no-op', () => {
  holdKey('t:done', 'key-1');
  releaseKey('t:done');
  assert.notEqual(keyForTarget('t:done'), 'key-1');
  assert.doesNotThrow(() => releaseKey('t:never-held'));
});
