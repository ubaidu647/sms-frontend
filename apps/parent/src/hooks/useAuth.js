import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useTokenStore } from "@/store/tokenStore";
import { useUserStore } from "@/store/userStore";
import { useChildStore } from "@/store/childStore";
import { clearAuthCookies } from "@/utils/clearAuthCookies";

// One logout per page load, shared by every useAuth() instance (TopBar and
// SideBar each hold one). The hard reload below resets it.
let logoutInFlight = false;

// Thin auth helper shared by the sign-in flow.
export function useAuth() {
  const queryClient = useQueryClient();
  const markSignedIn = useTokenStore((s) => s.markSignedIn);
  const clearTokens = useTokenStore((s) => s.clearTokens);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const user = useUserStore((s) => s.user);
  const clearSelectedChild = useChildStore((s) => s.clearSelectedChild);

  // payload = { user } — the tokens arrived as httpOnly cookies, never here.
  const login = (payload) => {
    logoutInFlight = false;
    // Never let a previous parent's cached data leak into this session.
    queryClient.clear();
    clearSelectedChild();
    markSignedIn();
    if (payload.user) setUser(payload.user);
  };

  // Only the API can clear the httpOnly session cookies, so wait for it before
  // navigating away. A failure still falls through to local cleanup. Then drop
  // the React Query cache and hard-reload to /signin so no in-memory data from
  // this parent survives for the next one (matches the admin app).
  // `reason` (optional) is shown on the sign-in page after the reload.
  const logout = async ({ reason } = {}) => {
    if (logoutInFlight) return;
    logoutInFlight = true;
    await apiClient
      .post("/auth/logout", {}, { skipAuthRefresh: true })
      .catch((err) => console.warn("logout API call failed", err));
    clearTokens();
    clearUser();
    clearSelectedChild();
    clearAuthCookies();
    queryClient.cancelQueries();
    queryClient.clear();
    if (typeof window !== "undefined") {
      window.location.replace(
        reason ? `/signin?reason=${encodeURIComponent(reason)}` : "/signin",
      );
    }
  };

  return { user, login, logout };
}
