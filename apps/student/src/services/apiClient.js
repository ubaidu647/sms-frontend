import axios from 'axios';
import toast from 'react-hot-toast';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { clearAuthCookies } from '@/utils/clearAuthCookies';
import { withSessionHeaders, AUTH_MODE_HEADERS, readCsrfToken } from '@/utils/session';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001/api',
  // The session is an httpOnly cookie, so every request must carry cookies.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// No Authorization header: the browser attaches the session cookie itself.
apiClient.interceptors.request.use(withSessionHeaders);

function logoutAndRedirect() {
  useTokenStore.getState().clearTokens();
  // The profile is persisted (localStorage): drop it too, or the next visitor on
  // this browser boots with the previous user's data. The in-memory query cache
  // goes with the full-page navigation below.
  useUserStore.getState().clearUser();
  useUserStore.persist?.clearStorage?.();
  clearAuthCookies();
  if (typeof window !== 'undefined') window.location.replace('/signin');
}

// One refresh in flight at a time; concurrent 401s wait for it and retry.
let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: {
            ...AUTH_MODE_HEADERS,
            'X-CSRF-Token': readCsrfToken() || '',
          },
        },
      )
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// On 401 the access cookie has expired: refresh once from the refresh cookie
// and retry. Only when the refresh itself fails is the session really over. A
// failed login returns 401 too, so skip the login endpoint entirely.
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config || {};
    const status = error.response?.status;
    const url = orig.url || '';

    if (status !== 401 || orig.skipAuthRefresh || url.includes('/auth/student/login')) {
      return Promise.reject(error);
    }

    if (orig._retry) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    orig._retry = true;
    // No session cookie at all → nothing to refresh; don't spend the shared
    // refresh rate-limit budget asking.
    if (!readCsrfToken()) {
      logoutAndRedirect();
      return Promise.reject(error);
    }
    try {
      await refreshSession();
    } catch (refreshError) {
      // Only an explicit rejection of the refresh cookie ends the session. A
      // throttle (429), an infra error (503) or a dropped connection is
      // temporary: keep the user signed in and let them retry.
      const refreshStatus = refreshError.response?.status;
      if (refreshStatus === 401 || refreshStatus === 403) {
        logoutAndRedirect();
      } else {
        toast.error("Can't reach the server right now. Check your connection and try again.", {
          id: 'session-refresh-offline',
        });
      }
      return Promise.reject(error);
    }
    // The user may have signed out while the refresh was in flight — don't
    // replay the request into a session that no longer exists.
    if (!useTokenStore.getState().accessToken) return Promise.reject(error);
    return apiClient(orig);
  },
);

export default apiClient;
