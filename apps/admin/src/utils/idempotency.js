// One key per opened payment form, reused on every retry of that submission so
// the server recognises a replay instead of recording the payment twice.
// crypto.randomUUID needs a secure context (https/localhost); fall back otherwise.
export function newIdempotencyKey() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const idempotencyHeader = (key) => (key ? { 'Idempotency-Key': key } : undefined);

// The same key sent with a changed payload: the server refuses with 409 and
// "Idempotency-Key was already used for a different request". This happens when
// an earlier attempt did go through (e.g. the response was lost) and the user
// then edited the form — retrying with that key can never succeed.
export const KEY_REUSED_MESSAGE =
  'Your earlier attempt was already recorded — check the list before trying again';

export function isKeyReusedConflict(err) {
  if (!err || err.status !== 409) return false;
  const msg = String(err.message || '');
  return /idempotency-key/i.test(msg) && /different/i.test(msg);
}

// The key matches a document that was recorded and has been voided since: the
// server refuses with 409 "This sale/purchase/(supplier) payment was voided".
// Retrying with that key can never succeed either.
export const KEY_VOIDED_MESSAGE =
  'Your earlier attempt was recorded and later voided — submit again to record a new one';

export function isKeyVoidedConflict(err) {
  if (!err || err.status !== 409) return false;
  return /^this .*\bwas voided\b/i.test(String(err.message || '').trim());
}

/**
 * For a 409 that means this form's key is spent (reused for a different request,
 * or matching a since-voided document), the message to show; otherwise null.
 * The caller should then start a fresh key and refresh the lists.
 */
export function spentKeyMessage(err) {
  if (isKeyReusedConflict(err)) return KEY_REUSED_MESSAGE;
  if (isKeyVoidedConflict(err)) return KEY_VOIDED_MESSAGE;
  return null;
}

// A 200 replay of an earlier, identical submission carries a technical message
// ("… already recorded for this Idempotency-Key"); show a friendly one instead.
export const REPLAY_MESSAGE = 'Already recorded';

export function isReplayMessage(message) {
  return /idempotency-key/i.test(String(message || ''));
}

/** Toast text for a successful (possibly replayed) submission. */
export function successMessage(res, fallback) {
  const msg = res?.message;
  if (isReplayMessage(msg)) return REPLAY_MESSAGE;
  return msg || fallback;
}
