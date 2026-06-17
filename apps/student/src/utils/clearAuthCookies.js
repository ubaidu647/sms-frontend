// Expire the auth cookies the middleware relies on.
export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth-storage=; path=/; max-age=0;';
  document.cookie = 'auth-role=; path=/; max-age=0;';
}
