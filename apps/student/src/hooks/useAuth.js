import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { clearAuthCookies } from '@/utils/clearAuthCookies';

// Thin auth helper shared by the sign-in flow.
export function useAuth() {
  const setTokens = useTokenStore((s) => s.setTokens);
  const clearTokens = useTokenStore((s) => s.clearTokens);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const user = useUserStore((s) => s.user);

  // payload = { token | accessToken, refreshToken, user }
  const login = (payload) => {
    setTokens({
      accessToken: payload.token || payload.accessToken || null,
      refreshToken: payload.refreshToken || null,
    });
    if (payload.user) setUser(payload.user);
  };

  const logout = () => {
    clearTokens();
    clearUser();
    clearAuthCookies();
  };

  return { user, login, logout };
}
