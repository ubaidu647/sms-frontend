import { ROLE_COOKIE } from "@/utils/session";

// Expire the cookies this page wrote. The httpOnly session cookies can only be
// cleared by the API (POST /auth/logout).
export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = "auth-storage=; path=/; max-age=0;";
  document.cookie = "auth-role=; path=/; max-age=0;"; // pre-portal name
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0;`;
}
