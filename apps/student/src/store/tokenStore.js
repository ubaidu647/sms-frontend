import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Session state — no secrets.
 *
 * The access and refresh tokens are httpOnly cookies set by the API; this page
 * cannot read them, which is the point (an XSS payload cannot steal them). What
 * lives here is only whether we believe a session exists.
 *
 * `accessToken` keeps its old name but now holds the non-secret SESSION_MARKER:
 * well over a hundred components gate their queries on `enabled: !!token`, and
 * renaming the field would touch every one of them for no security gain.
 */
export const SESSION_MARKER = "cookie-session";

export const useTokenStore = create(
  persist(
    (set) => ({
      accessToken: null,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),
      markSignedIn: () => set({ accessToken: SESSION_MARKER }),
      clearTokens: () => set({ accessToken: null }),
    }),
    {
      name: "token-storage",
      // v1 stored the real tokens in localStorage. Drop them on upgrade — the
      // user signs in once more and gets a cookie session.
      version: 2,
      migrate: () => ({ accessToken: null }),
      partialize: ({ accessToken }) => ({ accessToken }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
