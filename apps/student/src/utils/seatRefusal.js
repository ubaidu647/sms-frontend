import { isPasswordChangeRequired, planRefusalMessage } from "./authErrors.js";

// A student who no longer holds a seat (graduated, left) is refused the school's
// current activity: announcements, homework and the library catalogue. That is
// an answer, not a failure, so the pages show it calmly and do not retry.
// Fees, results and attendance stay readable and never come through here.

export const SEAT_REFUSAL_FALLBACK =
  "This section is no longer available. Please contact the school office if you think this is a mistake.";

/**
 * The text to show when `err` is a refusal on one of those routes, else null.
 * Any 403 counts, with or without a `code`, apart from the session-level
 * refusals the API client deals with itself.
 */
export function seatRefusalMessage(err) {
  if (err?.response?.status !== 403) return null;
  if (planRefusalMessage(err) || isPasswordChangeRequired(err)) return null;
  const message = err.response.data?.message;
  const text = typeof message === "string" ? message.trim() : "";
  return text || SEAT_REFUSAL_FALLBACK;
}

/** react-query `retry`: its default three retries, none after a 403. */
export function retryUnlessRefused(failureCount, err) {
  return err?.response?.status !== 403 && failureCount < 3;
}
