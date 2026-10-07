import { useEffect, useRef, useState } from 'react';
import apiClient, { markSessionEnded } from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { clearAuthCookies } from '@/utils/clearAuthCookies';
import { readCsrfToken, writeRoleCookie } from '@/utils/session';

/**
 * The session marker lives in localStorage, the session itself in cookies; the
 * two can disagree (storage cleared, another tab). When there is no marker but
 * the CSRF cookie says a cookie session exists, ask the API once per page load
 * who we are and restore the marker. Shared by every useAuth() instance.
 */
let restorePromise = null;
function restoreSession() {
  if (!restorePromise) {
    // A 401 here may just be an expired access cookie, so let the client
    // refresh — but never redirect: the caller decides what a dead session
    // means. No response at all means the API is unreachable, which is not
    // the same as signed out.
    restorePromise = apiClient
      .get('/auth/me', { skipLogoutRedirect: true })
      .then((res) => {
        const user = res.data?.data?.user || res.data?.user || null;
        return user ? { status: 'ok', user } : { status: 'none' };
      })
      .catch((err) => {
        restorePromise = null; // allow a retry
        // 429 (throttled) is "try again later", not "signed out".
        const code = err.response?.status;
        return code && code !== 429 ? { status: 'none' } : { status: 'offline' };
      });
  }
  return restorePromise;
}

// One logout per page load, shared by every useAuth() instance. The page hard
// reloads to /signin afterwards, which resets it.
let logoutInFlight = false;

export const useAuth = () => {
  const { accessToken, hasHydrated, markSignedIn, clearTokens } = useTokenStore();
  const { user, setUser, clearUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const hasFetchedUser = useRef(false);

  const login = (data) => {
    logoutInFlight = false;
    const u = data.userCreated || data.user;
    if (u && u.id && !u._id) u._id = u.id;
    setUser(u);
    // The tokens arrived as httpOnly cookies; only record that we are signed in.
    markSignedIn();
    hasFetchedUser.current = false;
  };

  useEffect(() => {
    if (!hasHydrated) return;

    // Fetch current user only once when accessToken exists
    if (accessToken && !hasFetchedUser.current) {
      hasFetchedUser.current = true;

      (async () => {
        try {
          const res = await apiClient.get('/auth/me');

          if (!res) return;
          // Backend wraps /auth/me as { data: { user }, status, message }; older
          // shape was { user } at the body root. Support both.
          const me = res.data?.data?.user || res.data?.user;
          if (!me) {
            // Log only the status — the body can carry personal data.
            console.error('Failed to parse /auth/me — no user in payload (status %s)', res.status);
            return;
          }
          // /auth/me returns `id`, /auth/login returns `_id`. Alias so the rest of
          // the app can always read user._id.
          if (me.id && !me._id) me._id = me.id;
          writeRoleCookie(me.role);
          setUser(me);
        } catch (err) {
          // The axios error object carries the request config (auth headers);
          // log just the status and message.
          console.error(
            'Failed to fetch /auth/me:',
            err?.response?.status ?? '',
            err?.message || 'unknown error',
          );
        } finally {
          setLoading(false);
        }
      })();
    } else if (!accessToken && readCsrfToken()) {
      restoreSession()
        .then(({ status, user: me }) => {
          setOffline(status === 'offline');
          if (status !== 'ok') return;
          if (me.id && !me._id) me._id = me.id;
          // The role cookie may be gone too (it is what middleware routes on).
          writeRoleCookie(me.role);
          setUser(me);
          hasFetchedUser.current = true; // already have the user — skip the refetch
          markSignedIn();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hasHydrated, accessToken, clearTokens, clearUser, setUser, markSignedIn]);

  const logout = async () => {
    // Module-level (not per-instance) guard: the TopBar's logout clears the
    // tokens, which makes the dashboard layout's own useAuth() call logout()
    // again — a per-instance ref let that send a second POST /auth/logout.
    if (logoutInFlight) return;
    logoutInFlight = true;

    // Only the API can clear the httpOnly session cookies, so wait for it
    // before navigating — a redirect would cancel the request and leave the
    // cookies (and the session) alive. Failures still fall through to local
    // cleanup, and a 401 here must not trigger a refresh.
    await apiClient
      .post('/auth/logout', {}, { skipAuthRefresh: true })
      .catch((err) => console.warn('logout API call failed', err?.message));

    markSessionEnded();
    clearUser();
    clearTokens();
    hasFetchedUser.current = false;
    clearAuthCookies();

    // Hard reload to dump in-memory React Query caches and component state
    // that may hold sensitive data. Matches apiClient's 401 redirect path.
    if (typeof window !== 'undefined') window.location.href = '/signin';
  };

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    offline,
    login,
    logout,
    loading,
    hasHydrated,
  };
};
