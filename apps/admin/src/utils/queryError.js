// Helpers for rendering React Query failures in detail views.

/** HTTP status of an axios error (or an Error carrying `.status`), if any. */
export const errorStatus = (err) => err?.response?.status ?? err?.status;

/** The server's human-readable message, falling back to a generic one. */
export const errorMessage = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;

/**
 * `retry` option: a 4xx (forbidden, not found, bad request…) will not change on
 * retry, so fail immediately; anything else gets the usual couple of retries.
 */
export const retryUnless4xx = (failureCount, err) => {
  const status = errorStatus(err);
  if (status >= 400 && status < 500) return false;
  return failureCount < 2;
};
