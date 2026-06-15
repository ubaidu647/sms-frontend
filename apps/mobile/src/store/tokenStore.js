import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
