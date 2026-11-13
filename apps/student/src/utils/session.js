/**
 * Client side of the API's cookie session (see sms-backend/src/utils/authCookies.ts).
 *
 * The API sets three cookies per portal: `sms_at_*` and `sms_rt_*` (httpOnly —
 * invisible here) and `sms_csrf_*`, which this page reads and echoes in `X-CSRF-Token` on every
 * request that can change state. Another site can make the browser send the
 * cookies, but cannot read `sms_csrf_*`, so it cannot forge the header.
 */
export const AUTH_MODE_HEADERS = { "X-Auth-Mode": "cookie" };

/**
 * This app's portal. Each portal has its own cookies (`sms_at_student`, …) and
 * the API picks them by the request's Origin, so signing in to another portal
 * in the same browser never replaces this one's session.
 */
export const PORTAL = "student";
export const SESSION_COOKIE = `sms_at_${PORTAL}`;
const CSRF_COOKIE = `sms_csrf_${PORTAL}`;
/** Client-written role hint for routing. Per portal: on localhost every port
 * shares cookies, so one name let an admin sign-in overwrite the system app's. */
export const ROLE_COOKIE = `auth-role-${PORTAL}`;

/** localStorage key of the persisted token store (see store/tokenStore.js). */
export const TOKEN_STORAGE_KEY = "token-storage";

const hasSessionMarker = (raw) => {
  try {
    return !!JSON.parse(raw)?.state?.accessToken;
  } catch {
    return false;
  }
};

/**
 * Did this `storage` event end the session? Logging out rewrites the entry with
 * a null marker rather than removing it, and a null `key` means storage was
 * cleared. Fires in the other tabs only, never in the tab that logged out.
 */
export function isCrossTabSignOut({ key, oldValue, newValue }) {
  if (key === null) return true;
  return (
    key === TOKEN_STORAGE_KEY &&
    hasSessionMarker(oldValue) &&
    !hasSessionMarker(newValue)
  );
}

const SAFE_METHODS = ["get", "head", "options"];

export function readCsrfToken() {
  if (typeof document === "undefined") return null;
  const prefix = `${CSRF_COOKIE}=`;
  const match = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

/** Axios request interceptor: cookie mode + CSRF header on writes. */
export function withSessionHeaders(config) {
  Object.assign(config.headers, AUTH_MODE_HEADERS);
  if (!SAFE_METHODS.includes((config.method || "get").toLowerCase())) {
    const csrf = readCsrfToken();
    if (csrf) config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
}
