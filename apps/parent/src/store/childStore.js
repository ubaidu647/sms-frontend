import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// localStorage can throw (private mode, blocked site data, quota). The selected
// child is only a convenience, so a failing storage just means "no memory".
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

// Which of the parent's children the dashboard is showing. Only the child's
// _id is persisted; names/classes come fresh from /dashboard/parent/children.
export const useChildStore = create(
  persist(
    (set) => ({
      selectedChildId: null,
      setSelectedChildId: (selectedChildId) => set({ selectedChildId }),
      clearSelectedChild: () => set({ selectedChildId: null }),
    }),
    {
      name: "parent-child-storage",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: ({ selectedChildId }) => ({ selectedChildId }),
    },
  ),
);
