import axios from 'axios';
import toast from 'react-hot-toast';
import { useTokenStore } from '@/store/tokenStore';
import { clearAuthCookies } from '@/utils/clearAuthCookies';

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
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((c) => {
  const t = useTokenStore.getState().accessToken;
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

function handleLogoutAndRedirect() {
  useTokenStore.getState().clearTokens();
  clearAuthCookies();
  if (typeof window !== 'undefined') window.location.replace('/signin');
}

let isRefreshing = false;
let refreshSubscribers = [];

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    const status = error.response?.status;
    const store = useTokenStore.getState();

    // 402 = subscription gate blocked a write (expired/cancelled/none). Signal the
    // SubscriptionGuard to re-check state immediately so the banner/block shows
    // without waiting for the next poll. Callers still get the rejection + message.
    if (status === 402 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('subscription:blocked'));
    }

    // 429 = rate limited (login or global throttle). Surface the message and let
    // the form count down — but keep the session intact and let the caller reject.
    if (status === 429) {
      handleRateLimited(error.response, orig?.url);
      return Promise.reject(error);
    }

    if (status === 401 && !orig._retry && !orig.url.includes('/auth/login')) {
      orig._retry = true;

      if (!store.refreshToken) {
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }

      const retry = new Promise((resolve) => {
        refreshSubscribers.push((newT) => {
          if (newT) {
            orig.headers.Authorization = `Bearer ${newT}`;
            resolve(apiClient(orig));
          } else resolve(null);
        });
      });

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            { refreshToken: store.refreshToken },
            { withCredentials: true },
          );
          const { accessToken, refreshToken } = res.data.data;
          store.setTokens({ accessToken, refreshToken });
          console.log('useTokenStore.getState().accessToken', useTokenStore.getState().accessToken);
          refreshSubscribers.forEach((cb) => cb(accessToken));
          refreshSubscribers = [];
          return retry;
        } catch (e) {
          refreshSubscribers.forEach((cb) => cb(null));
          refreshSubscribers = [];
          // A throttled refresh is "slow down", not "session invalid" — keep the
          // user logged in, show the message, and let the original call reject.
          if (e.response?.status === 429) {
            handleRateLimited(e.response, '/auth/refresh');
            return Promise.reject(e);
          }
          handleLogoutAndRedirect();
          // return Promise.reject(e);
          return Promise.resolve(null);
        } finally {
          isRefreshing = false;
        }
      }
      return retry;
    }
    return Promise.reject(error);
  },
);

export default apiClient;
