/**
 * Client side of the API's cookie session (see sms-backend/src/utils/authCookies.ts).
 *
 * The API sets three cookies per portal: `sms_at_*` and `sms_rt_*` (httpOnly —
 * invisible here) and `sms_csrf_*`, which this page reads and echoes in `X-CSRF-Token` on every
 * request that can change state. Another site can make the browser send the
 * cookies, but cannot read `sms_csrf_*`, so it cannot forge the header.
 */
export const AUTH_MODE_HEADERS = { 'X-Auth-Mode': 'cookie' };

/**
 * This app's portal. Each portal has its own cookies (`sms_at_admin`, …) and
 * the API picks them by the request's Origin, so signing in to another portal
 * in the same browser never replaces this one's session.
 */
export const PORTAL = 'admin';
export const SESSION_COOKIE = `sms_at_${PORTAL}`;
const CSRF_COOKIE = `sms_csrf_${PORTAL}`;
/** Client-written role hint for routing. Per portal: on localhost every port
 * shares cookies, so one name let an admin sign-in overwrite the system app's. */
export const ROLE_COOKIE = `auth-role-${PORTAL}`;

const SAFE_METHODS = ['get', 'head', 'options'];

export function readCsrfToken() {
  if (typeof document === 'undefined') return null;
  const prefix = `${CSRF_COOKIE}=`;
  const match = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

/** Axios request interceptor: cookie mode + CSRF header on writes. */
export function withSessionHeaders(config) {
  Object.assign(config.headers, AUTH_MODE_HEADERS);
  if (!SAFE_METHODS.includes((config.method || 'get').toLowerCase())) {
    const csrf = readCsrfToken();
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
  }
  return config;
}

/**
 * Writes the routing-hint role cookie. Only what middleware.js reads is stored
 * — a full role (hundreds of action strings) can exceed the 4 KB cookie limit,
 * in which case the browser silently drops it and routing breaks.
 */
export function writeRoleCookie(role) {
  if (typeof document === 'undefined') return;
  const slim = {
    name: role?.name ?? null,
    isPredefined: !!role?.isPredefined,
    hasActions: Array.isArray(role?.actions) && role.actions.length > 0,
  };
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(
    JSON.stringify(slim),
  )}; path=/; max-age=604800; SameSite=Lax;`;
}
