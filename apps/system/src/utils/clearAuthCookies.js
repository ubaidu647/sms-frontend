import { ROLE_COOKIE } from '@/utils/session';

export const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;

  // Clears the cookies this page wrote itself (`auth-role`, plus names older
  // builds used). The httpOnly session cookies can only be cleared by the API —
  // see POST /auth/logout.
  const cookieNames = [
    ROLE_COOKIE,
    'auth-storage',
    'auth-role',
    'accessToken',
    'refreshToken',
    'token',
  ];
  const now = new Date();
  now.setTime(now.getTime() - 1); // Expire in past

  cookieNames.forEach((name) => {
    document.cookie = `${name}=; path=/; expires=${now.toUTCString()}; SameSite=Lax`;
  });
};
