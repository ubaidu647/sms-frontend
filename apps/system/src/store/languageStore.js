import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    { name: 'language-storage' },
  ),
);
