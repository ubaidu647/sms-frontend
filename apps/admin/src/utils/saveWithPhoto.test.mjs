import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoFailureMessage, saveFieldsThenPhoto } from './saveWithPhoto.js';

const photo = new Blob(['x'], { type: 'image/png' });

const recorder = (failOn) => {
  const calls = [];
  const put = async (payload) => {
    const kind = payload instanceof FormData ? 'photo' : 'fields';
    calls.push(kind);
    if (kind === failOn) throw new Error(`${kind} refused`);
    return { kind };
  };
  return { calls, put };
};

test('fields without a photo: one JSON request', async () => {
  const { calls, put } = recorder();
  assert.deepEqual(await saveFieldsThenPhoto({ fields: { a: 1 }, put }), { kind: 'fields' });
  assert.deepEqual(calls, ['fields']);
});

test('fields and a photo: JSON first, then multipart', async () => {
  const { calls, put } = recorder();
  assert.deepEqual(await saveFieldsThenPhoto({ fields: { a: 1 }, photo, put }), { kind: 'photo' });
  assert.deepEqual(calls, ['fields', 'photo']);
});

test('a photo alone (the retry): multipart only', async () => {
  const { calls, put } = recorder();
  await saveFieldsThenPhoto({ fields: {}, photo, put });
  assert.deepEqual(calls, ['photo']);
});

test('a photo failure after saved fields is marked fieldsSaved', async () => {
  const { put } = recorder('photo');
  await assert.rejects(saveFieldsThenPhoto({ fields: { a: 1 }, photo, put }), (err) => {
    assert.equal(err.fieldsSaved, true);
    assert.equal(photoFailureMessage(err), 'Details saved, but the photo failed: photo refused');
    return true;
  });
});

test('a photo-only failure saved nothing', async () => {
  const { put } = recorder('photo');
  await assert.rejects(saveFieldsThenPhoto({ fields: {}, photo, put }), (err) => {
    assert.equal(err.fieldsSaved, undefined);
    return true;
  });
});

test('a fields failure stops before the photo', async () => {
  const { calls, put } = recorder('fields');
  await assert.rejects(saveFieldsThenPhoto({ fields: { a: 1 }, photo, put }), (err) => {
    assert.equal(err.fieldsSaved, undefined);
    return true;
  });
  assert.deepEqual(calls, ['fields']);
});
