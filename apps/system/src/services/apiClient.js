import axios from 'axios';
import toast from 'react-hot-toast';
import { useTokenStore } from '@/store/tokenStore';
import { clearAuthCookies } from '@/utils/clearAuthCookies';
import { withSessionHeaders, AUTH_MODE_HEADERS, readCsrfToken } from '@/utils/session';

// Default retry window when the Retry-After header can't be read. Browsers won't
// expose Retry-After / RateLimit-* cross-origin unless the backend adds them to
// CORS exposedHeaders, so this fallback (15 min) matches the login throttle.
const RATE_LIMIT_FALLBACK_SECONDS = 900;

export function getRetryAfterSeconds(headers = {}) {
  const raw = Number(headers?.['retry-after']);
  return Number.isFinite(raw) && raw > 0 ? raw : RATE_LIMIT_FALLBACK_SECONDS;
}

// Centralized 429 handling: show the server's human-readable message (deduped so
// a burst of throttled requests collapses into one toast) and broadcast a
// `rate-limit` event so forms can start a retry countdown. A 429 is "slow down",
// NOT "unauthenticated" — callers/interceptor must never clear tokens or redirect.
function handleRateLimited(response, url) {
  const retryAfter = getRetryAfterSeconds(response?.headers);
  const message = response?.data?.message || 'Too many attempts. Please try again later.';
  toast.error(message, { id: 'rate-limit' });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rate-limit', { detail: { retryAfter, message, url } }));
  }
  return retryAfter;
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001/api',
  // The session is an httpOnly cookie, so every request must carry cookies.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// No Authorization header: the browser attaches the session cookie itself.
apiClient.interceptors.request.use(withSessionHeaders);

function handleLogoutAndRedirect() {
  useTokenStore.getState().clearTokens();
  clearAuthCookies();
  if (typeof window !== 'undefined') window.location.replace('/signin');
}

// One refresh in flight at a time; concurrent 401s wait on the same promise.
let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { ...AUTH_MODE_HEADERS, 'X-CSRF-Token': readCsrfToken() || '' },
        },
      )
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config || {};
    const status = error.response?.status;
    const url = orig.url || '';

    // 402 = subscription gate blocked a write (expired/cancelled/none). Signal the
    // SubscriptionGuard to re-check state immediately so the banner/block shows
    // without waiting for the next poll. Callers still get the rejection + message.
    if (status === 402 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subscription:blocked'));
    }

    // 429 = rate limited (login or global throttle). Surface the message and let
    // the form count down — but keep the session intact and let the caller reject.
    if (status === 429) {
      handleRateLimited(error.response, url);
      return Promise.reject(error);
    }

    // 401 = the access cookie expired (or is gone). Refresh once from the
    // refresh cookie and replay; only a failed refresh ends the session.
    if (
      status === 401 &&
      !orig._retry &&
      !orig.skipAuthRefresh &&
      !url.includes('/auth/system/login')
    ) {
      orig._retry = true;
      // No session cookie at all → nothing to refresh. Asking anyway only
      // burns the shared refresh rate-limit budget of everyone on this network.
      if (!readCsrfToken()) {
        if (orig.skipLogoutRedirect) return Promise.reject(error);
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }
      try {
        await refreshSession();
        return apiClient(orig);
      } catch (e) {
        // A throttled refresh is "slow down", not "session invalid".
        if (e.response?.status === 429) {
          handleRateLimited(e.response, '/auth/refresh');
          return Promise.reject(e);
        }
        // The caller handles a dead session itself (session restore).
        if (orig.skipLogoutRedirect) return Promise.reject(error);
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
