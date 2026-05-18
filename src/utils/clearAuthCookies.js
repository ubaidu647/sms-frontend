export const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;

  const cookieNames = ['auth-storage', 'accessToken', 'refreshToken', 'token'];
  const now = new Date();
  now.setTime(now.getTime() - 1); // Expire in past

  cookieNames.forEach((name) => {
    document.cookie = `${name}=; path=/; expires=${now.toUTCString()}; SameSite=Lax`;
  });
};
