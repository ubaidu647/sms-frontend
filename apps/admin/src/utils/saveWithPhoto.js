/**
 * Saves an edit form's fields, then its new photo. Cleared fields go as `null`,
 * which multipart can't carry, so the fields travel as JSON and the photo
 * follows in its own multipart request (alone, it can't clear anything).
 *
 * The two requests are not atomic: a photo failure after the fields were saved
 * rejects with `err.fieldsSaved = true`, so the form can treat them as committed.
 */
export async function saveFieldsThenPhoto({ fields, photo, put }) {
  const hasFields = Object.keys(fields).length > 0;
  let res;
  if (hasFields || !photo) res = await put(fields);
  if (!photo) return res;

  const fd = new FormData();
  fd.append('photo', photo);
  try {
    return await put(fd);
  } catch (err) {
    if (hasFields) err.fieldsSaved = true;
    throw err;
  }
}

export const photoFailureMessage = (err) =>
  `Details saved, but the photo failed: ${err?.message || 'upload error'}`;
