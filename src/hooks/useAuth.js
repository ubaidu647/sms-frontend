import { useEffect, useRef, useState } from 'react';
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
    setUser(data.userCreated || data.user);
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
          if (res) {
            document.cookie = `auth-role=${encodeURIComponent(
              JSON.stringify(res?.data?.user?.role),
            )}; path=/; max-age=86400;`;
            setUser(res.data.user);
          }
        } catch (err) {
          console.error('Failed to fetch /auth/me:', err);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [hasHydrated, accessToken, refreshToken, clearTokens, clearUser]);

  const logout = () => {
    if (isLoggingOut.current) return; // Prevent multiple calls
    isLoggingOut.current = true;

    clearUser();
    clearTokens();
    hasFetchedUser.current = false;
    // redirectToSignin();
    clearAuthCookies();
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
