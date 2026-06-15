import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import apiClient from '@/services/apiClient';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { clearAuthCookies } from '@/utils/clearAuthCookies';

export const useAuth = () => {
  const { accessToken, refreshToken, hasHydrated, setTokens, clearTokens } = useTokenStore();
  const { user, setUser, clearUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const hasFetchedUser = useRef(false);
  const isLoggingOut = useRef(false); // Prevent double logout/redirect

  const login = (data) => {
    const u = data.userCreated || data.user;
    if (u && u.id && !u._id) u._id = u.id;
    setUser(u);
    setTokens({
      accessToken: data.accessToken || data.token,
      refreshToken: data.refreshToken,
    });
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
            console.error('Failed to parse /auth/me — no user in payload', res.data);
            return;
          }
          // /auth/me returns `id`, /auth/login returns `_id`. Alias so the rest of
          // the app can always read user._id.
          if (me.id && !me._id) me._id = me.id;
          document.cookie = `auth-role=${encodeURIComponent(
            JSON.stringify(me.role || {}),
          )}; path=/; max-age=86400;`;
          setUser(me);
        } catch (err) {
          console.error('Failed to fetch /auth/me:', err);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [hasHydrated, accessToken, refreshToken, clearTokens, clearUser, setUser]);

  const logout = () => {
    if (isLoggingOut.current) return; // Prevent multiple calls
    isLoggingOut.current = true;

    // Capture tokens before clearing — server needs both to revoke this session.
    const { accessToken: at, refreshToken: rt } = useTokenStore.getState();

    // Best-effort server-side revoke. Use raw axios (not apiClient) so the
    // header is attached synchronously from captured values, and we don't
    // re-enter the 401 refresh interceptor. Never block local cleanup on it.
    if (at && rt) {
      const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      axios
        .post(
          `${baseURL}/auth/logout`,
          { refreshToken: rt },
          { headers: { Authorization: `Bearer ${at}` } },
        )
        .catch((err) => console.warn('logout API call failed', err));
    }

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
    refreshToken,
    isAuthenticated: !!accessToken,
    login,
    logout,
    loading,
    hasHydrated,
  };
};
