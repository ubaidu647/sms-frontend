import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', dir: 'ltr', flag: '🇬🇧' },
  { code: 'ur', label: 'Urdu', native: 'اردو', dir: 'rtl', flag: '🇵🇰' },
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl', flag: '🇸🇦' },
];

export const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
