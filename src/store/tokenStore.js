import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTokenStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),
      setTokens: (tokens) => set(tokens),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
    }),
    {
      name: 'token-storage',
      onRehydrateStorage: () => (state) => {
        // 👇 called once persistence finishes restoring
        state?.setHasHydrated(true);
        console.log('✅ Zustand rehydrated');
      },
    },
  ),
);
