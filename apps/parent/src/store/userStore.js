import { create } from "zustand";
import { persist } from "zustand/middleware";

// Only what the UI needs to boot before any request returns: the id (scopes the
// query cache), the account type (the dashboard guard admits only 'parent') and
// the name/role label shown in the top bar. Contact details and the rest of the
// profile stay in memory, never written to localStorage.
function pickPersistedUser(user) {
  if (!user || typeof user !== "object") return null;
  const roleName = typeof user.role === "object" ? user.role?.name : user.role;
  return {
    _id: user._id ?? user.id ?? null,
    id: user.id ?? user._id ?? null,
    name: user.name ?? null,
    type: user.type ?? null,
    ...(roleName ? { role: { name: roleName } } : {}),
  };
}

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "user-storage",
      // v0 persisted the full user record (email, phone, role actions). Strip it
      // down on upgrade.
      version: 1,
      migrate: (persisted) => ({ user: pickPersistedUser(persisted?.user) }),
      partialize: ({ user }) => ({ user: pickPersistedUser(user) }),
    },
  ),
);
