import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editPayload, emptiedRequired, reportEmptiedRequired } from './editPayload.js';

test('untouched fields are omitted', () => {
  assert.deepEqual(editPayload({ a: 'x', b: '' }, { a: 'x', b: '' }), {});
});

test('null/undefined/empty initial all count as blank', () => {
  assert.deepEqual(editPayload({ a: null, b: undefined }, { a: '', b: '' }), {});
});

test('changed values are sent', () => {
  assert.deepEqual(editPayload({ a: 'x' }, { a: 'y', b: 3 }), { a: 'y', b: 3 });
});

test('an emptied optional field is sent as null', () => {
  assert.deepEqual(editPayload({ cnic: '123', dob: '2000-01-01' }, { cnic: '', dob: '  ' }), {
    cnic: null,
    dob: null,
  });
});

test('an emptied required field is omitted, not nulled', () => {
  assert.deepEqual(
    editPayload({ name: 'A', note: 'n' }, { name: '', note: '' }, { required: ['name'] }),
    {
      note: null,
    },
  );
});

test('numbers compare by value with strings', () => {
  assert.deepEqual(editPayload({ n: 5 }, { n: '5' }), {});
  assert.deepEqual(editPayload({ n: 5 }, { n: '' }), { n: null });
  assert.deepEqual(editPayload({ n: 0 }, { n: '' }), { n: null });
});

test('objects compare as a whole and blank sub-fields are dropped', () => {
  const initial = { address: { street: 'S', city: 'C', state: '' } };
  assert.deepEqual(editPayload(initial, { address: { street: 'S', city: 'C', state: '' } }), {});
  assert.deepEqual(editPayload({ address: undefined }, { address: { street: '', city: '' } }), {});
  assert.deepEqual(editPayload(initial, { address: { street: 'S', city: '', state: '' } }), {
    address: { street: 'S' },
  });
  assert.deepEqual(editPayload(initial, { address: { street: '', city: '', state: '' } }), {
    address: null,
  });
});

test('booleans are compared as values', () => {
  assert.deepEqual(editPayload({ isActive: true }, { isActive: 'true' }), {});
  assert.deepEqual(editPayload({ isActive: true }, { isActive: false }), { isActive: false });
});

test('merge keys send only changed sub-fields, cleared ones as null', () => {
  const initial = { father: { name: 'F', cnic: '1', phone: '2' } };
  assert.deepEqual(
    editPayload(initial, { father: { name: 'F', cnic: '', phone: '3' } }, { merge: ['father'] }),
    { father: { cnic: null, phone: '3' } },
  );
  assert.deepEqual(
    editPayload(initial, { father: { ...initial.father } }, { merge: ['father'] }),
    {},
  );
  assert.deepEqual(
    editPayload(
      initial,
      { father: { name: '', cnic: '1', phone: '2' } },
      {
        merge: ['father'],
        required: ['father.name'],
      },
    ),
    {},
  );
});

test('emptiedRequired finds required fields that had a value and are now blank', () => {
  assert.deepEqual(
    emptiedRequired(
      { name: 'A', dob: '2000-01-01', capacity: 40, father: { name: 'F' } },
      { name: '  ', dob: '', capacity: null, father: { name: '' } },
      ['name', 'dob', 'capacity', 'father.name'],
    ),
    ['name', 'dob', 'capacity', 'father.name'],
  );
});

test('emptiedRequired counts 0 as a value', () => {
  assert.deepEqual(emptiedRequired({ n: 0 }, { n: '' }, ['n']), ['n']);
  assert.deepEqual(emptiedRequired({ n: 5 }, { n: 0 }, ['n']), []);
});

test('emptiedRequired treats a key the form dropped as blank', () => {
  // A yup transform to undefined removes the key from the submitted values.
  assert.deepEqual(emptiedRequired({ code: 'MATH' }, {}, ['code']), ['code']);
});

test('emptiedRequired ignores a field that was already blank, or was never in the form', () => {
  assert.deepEqual(emptiedRequired({ dob: '' }, { dob: '' }, ['dob']), []);
  assert.deepEqual(emptiedRequired({ father: {} }, { father: { name: '' } }, ['father.name']), []);
  assert.deepEqual(emptiedRequired({ name: 'A' }, { name: 'B' }, ['name', 'designation']), []);
});

test('reportEmptiedRequired sets a field error on each and focuses the first', () => {
  const calls = [];
  const setError = (...args) => calls.push(args);
  const messages = { name: 'Name is required', 'father.name': "Father's name is required" };

  assert.equal(
    reportEmptiedRequired(
      { name: 'A', father: { name: 'F' } },
      { name: '', father: { name: '' } },
      messages,
      setError,
    ),
    true,
  );
  assert.deepEqual(calls, [
    ['name', { type: 'required', message: 'Name is required' }, { shouldFocus: true }],
    [
      'father.name',
      { type: 'required', message: "Father's name is required" },
      { shouldFocus: false },
    ],
  ]);
});

test('reportEmptiedRequired lets a save through when nothing required was emptied', () => {
  const setError = () => assert.fail('no error expected');
  assert.equal(reportEmptiedRequired({ name: 'A' }, { name: 'B' }, { name: 'x' }, setError), false);
});
