/**
 * The payload of an edit form: only what the user changed.
 *
 * - An untouched field is left out (the API keeps its current value).
 * - A field changed to a new value is sent as that value.
 * - An optional field the user emptied (it had a value, now it is blank) is
 *   sent as `null`, which the API reads as "clear it". Fields listed in
 *   `required` are never sent as null: an emptied required field is left out.
 *   That is only a backstop, because leaving it out reports success while
 *   keeping the old value. Call `reportEmptiedRequired` first to block the save.
 *
 * Plain-object values (an address, an emergency contact) are compared as a
 * whole: blank sub-fields are dropped, and an object that ends up with no
 * non-blank sub-field counts as empty. Keys listed in `merge` are objects the
 * server merges into the stored one instead: only their changed sub-fields
 * are sent.
 */

const isPlainObject = (v) =>
  v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

const isBlank = (v) => {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v === 'number') return Number.isNaN(v);
  if (isPlainObject(v)) return Object.values(v).every(isBlank);
  if (Array.isArray(v)) return v.length === 0;
  return false;
};

// Drops blank sub-fields so `{ city: '' }` and `{}` compare equal.
const compact = (v) => {
  if (!isPlainObject(v)) return v;
  const out = {};
  for (const [k, sub] of Object.entries(v)) {
    if (!isBlank(sub)) out[k] = compact(sub);
  }
  return out;
};

const keyOf = (v) => {
  if (isBlank(v)) return '';
  if (isPlainObject(v)) {
    const c = compact(v);
    return JSON.stringify(
      Object.keys(c)
        .sort()
        .map((k) => [k, keyOf(c[k])]),
    );
  }
  if (Array.isArray(v)) return JSON.stringify(v.map(keyOf));
  return String(v);
};

export function editPayload(initial = {}, current = {}, { required = [], merge = [] } = {}) {
  const payload = {};
  for (const [key, value] of Object.entries(current)) {
    if (merge.includes(key)) {
      // The server merges this object into the stored one, so send only its
      // changed sub-fields (a cleared one as null). Dotted `required` entries
      // (`father.name`) protect sub-fields.
      const prefix = `${key}.`;
      const sub = editPayload(initial?.[key] || {}, isPlainObject(value) ? value : {}, {
        required: required.filter((r) => r.startsWith(prefix)).map((r) => r.slice(prefix.length)),
      });
      if (Object.keys(sub).length > 0) payload[key] = sub;
      continue;
    }
    if (keyOf(value) === keyOf(initial?.[key])) continue;
    if (isBlank(value)) {
      if (!required.includes(key)) payload[key] = null;
      continue;
    }
    payload[key] = isPlainObject(value) ? compact(value) : value;
  }
  return payload;
}

const valueAt = (obj, path) => path.split('.').reduce((v, key) => v?.[key], obj);

/**
 * The `required` paths (dotted for sub-fields: `father.name`) that had a value
 * and are now blank. One that was already blank is not reported, so an older
 * record missing a required field can still be edited.
 */
export function emptiedRequired(initial = {}, current = {}, required = []) {
  return required.filter(
    (path) => !isBlank(valueAt(initial, path)) && isBlank(valueAt(current, path)),
  );
}

/**
 * Puts a field error on every emptied required field; true when the save must
 * stop. `messages` maps each required path to its error. `setError` is
 * react-hook-form's.
 */
export function reportEmptiedRequired(initial, current, messages, setError) {
  const emptied = emptiedRequired(initial, current, Object.keys(messages));
  emptied.forEach((path, i) => {
    setError(path, { type: 'required', message: messages[path] }, { shouldFocus: i === 0 });
  });
  return emptied.length > 0;
}
