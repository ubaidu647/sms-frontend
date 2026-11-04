import axios from "axios";
import toast from "react-hot-toast";
import { useTokenStore } from "@/store/tokenStore";
import { useUserStore } from "@/store/userStore";
import { useChildStore } from "@/store/childStore";
import { clearAuthCookies } from "@/utils/clearAuthCookies";
import {
  PLAN_REASON,
  isPasswordChangeRequired,
  planRefusalMessage,
  rememberSigninNotice,
} from "@/utils/authErrors";
import {
  withSessionHeaders,
  AUTH_MODE_HEADERS,
  readCsrfToken,
} from "@/utils/session";

const apiClient = axios.create({
  // Dev-only fallback (backend default PORT=4000); a production `next build`
  // fails without NEXT_PUBLIC_BACKEND_URL — see next.config.mjs.
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000/api",
  // The session is an httpOnly cookie, so every request must carry cookies.
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// No Authorization header: the browser attaches the session cookie itself.
apiClient.interceptors.request.use(withSessionHeaders);

function logoutAndRedirect(reason) {
  useTokenStore.getState().clearTokens();
  // The profile is persisted (localStorage): drop it too, or the next visitor on
  // this browser boots with the previous user's data. The in-memory query cache
  // goes with the full-page navigation below.
  useUserStore.getState().clearUser();
  useUserStore.persist?.clearStorage?.();
  useChildStore.getState().clearSelectedChild();
  clearAuthCookies();
  if (typeof window !== "undefined") {
    window.location.replace(
      reason ? `/signin?reason=${encodeURIComponent(reason)}` : "/signin",
    );
  }
}

// The school's plan no longer covers this dashboard/platform: retrying or
// refreshing cannot help. End the session through the API first (only it can
// clear the httpOnly cookies; logout does not pass the plan gate), then sign
// out locally with the server's reason. Once per page load.
let planEnding = false;
function endSessionForPlan(message) {
  if (planEnding) return;
  planEnding = true;
  rememberSigninNotice(message);
  apiClient
    .post("/auth/logout", {}, { skipAuthRefresh: true, timeout: 8000 })
    .catch(() => {})
    .finally(() => logoutAndRedirect(PLAN_REASON));
}

// The API refuses everything but change-password until the password is
// changed: record it on the user so the dashboard layout shows that page.
function flagPasswordChange() {
  const { user, setUser } = useUserStore.getState();
  if (user && !user.mustChangePassword)
    setUser({ ...user, mustChangePassword: true });
}

// One refresh in flight at a time; concurrent 401s wait for it and retry.
let refreshPromise = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${apiClient.defaults.baseURL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: {
            ...AUTH_MODE_HEADERS,
            "X-CSRF-Token": readCsrfToken() || "",
          },
        },
      )
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// On 401 the access cookie has expired: refresh once from the refresh cookie
// and retry. Only when the refresh itself fails is the session really over. A
// failed login returns 401 too, so skip the login endpoint entirely.
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config || {};
    const status = error.response?.status;
    const url = orig.url || "";

    // 403 session-level refusals. Login shows its own error; logout must
    // never loop back here.
    if (
      status === 403 &&
      !url.includes("/auth/parent/login") &&
      !url.includes("/auth/logout")
    ) {
      const planMessage = planRefusalMessage(error);
      if (planMessage) endSessionForPlan(planMessage);
      else if (isPasswordChangeRequired(error)) flagPasswordChange();
      return Promise.reject(error);
    }

    if (
      status !== 401 ||
      orig.skipAuthRefresh ||
      url.includes("/auth/parent/login")
    ) {
      return Promise.reject(error);
    }

    if (orig._retry) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    orig._retry = true;
    // No session cookie at all → nothing to refresh; don't spend the shared
    // refresh rate-limit budget asking.
    if (!readCsrfToken()) {
      logoutAndRedirect();
      return Promise.reject(error);
    }
    try {
      await refreshSession();
    } catch (refreshError) {
      // Only an explicit rejection of the refresh cookie ends the session. A
      // throttle (429), an infra error (503) or a dropped connection is
      // temporary: keep the user signed in and let them retry.
      const refreshStatus = refreshError.response?.status;
      // The plan dropped this dashboard: say why instead of a bare sign-in.
      const planMessage = planRefusalMessage(refreshError);
      if (planMessage) {
        endSessionForPlan(planMessage);
      } else if (refreshStatus === 401 || refreshStatus === 403) {
        logoutAndRedirect();
      } else {
        toast.error(
          "Can't reach the server right now. Check your connection and try again.",
          {
            id: "session-refresh-offline",
          },
        );
      }
      return Promise.reject(error);
    }
    // The user may have signed out while the refresh was in flight — don't
    // replay the request into a session that no longer exists.
    if (!useTokenStore.getState().accessToken) return Promise.reject(error);
    return apiClient(orig);
  },
);

export default apiClient;
