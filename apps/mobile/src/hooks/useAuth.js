import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { router } from 'expo-router';
import apiClient from '../services/apiClient';
import { useTokenStore } from '../store/tokenStore';
import { useUserStore } from '../store/userStore';
import { BACKEND_URL } from '../config/env';

export const useAuth = () => {
  const { accessToken, refreshToken, hasHydrated, setTokens, clearTokens } = useTokenStore();
  const { user, setUser, clearUser } = useUserStore();
  const [loading, setLoading] = useState(true);
  const hasFetchedUser = useRef(false);
  const isLoggingOut = useRef(false);

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

    if (accessToken && !hasFetchedUser.current) {
      hasFetchedUser.current = true;

      (async () => {
        try {
          const res = await apiClient.get('/auth/me');
          if (!res) return;
          const me = res.data?.data?.user || res.data?.user;
          if (!me) return;
          if (me.id && !me._id) me._id = me.id;
          setUser(me);
        } catch (err) {
          console.warn('Failed to fetch /auth/me:', err?.message);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [hasHydrated, accessToken, refreshToken, clearTokens, clearUser, setUser]);

  const logout = () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    const { accessToken: at, refreshToken: rt } = useTokenStore.getState();

    if (at && rt) {
      axios
        .post(
          `${BACKEND_URL}/auth/logout`,
          { refreshToken: rt },
          { headers: { Authorization: `Bearer ${at}` } },
        )
        .catch(() => {});
    }

    clearUser();
    clearTokens();
    hasFetchedUser.current = false;
    router.replace('/(auth)/signin');
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
