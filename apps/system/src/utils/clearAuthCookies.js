export const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;

  // `auth-role` MUST be cleared too — middleware.js reads it and runs role-based
  // route checks even when `auth-storage` is gone, which can redirect a logged-out
  // user from /signin to /unauthorized.
  const cookieNames = ['auth-storage', 'auth-role', 'accessToken', 'refreshToken', 'token'];
  const now = new Date();
  now.setTime(now.getTime() - 1); // Expire in past

  cookieNames.forEach((name) => {
    document.cookie = `${name}=; path=/; expires=${now.toUTCString()}; SameSite=Lax`;
  });
};
