import { useCallback } from 'react';
import { useLanguageStore } from '../store/languageStore';
import en from './locales/en.json';
import ur from './locales/ur.json';
import ar from './locales/ar.json';

// Lightweight i18n mirroring next-intl's `useTranslations(namespace)` API so the
// same locale JSON files (copied from the web app) and the same `t('key')` /
// `t('key', { var })` call sites work here without an extra dependency.
const MESSAGES = { en, ur, ar };
const DEFAULT = 'en';

const getPath = (obj, path) =>
  path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

// next-intl uses ICU placeholders like "Theme set to {theme}".
const interpolate = (str, values) =>
  values
    ? str.replace(/\{(\w+)\}/g, (_, k) => (values[k] != null ? String(values[k]) : `{${k}}`))
    : str;

// `useTranslations('settings')` → t('theme.light'), t('language.toast', { lang })
export function useTranslations(namespace) {
  const language = useLanguageStore((s) => s.language);
  const lang = MESSAGES[language] ? language : DEFAULT;

  return useCallback(
    (key, values) => {
      const full = namespace ? `${namespace}.${key}` : key;
      let val = getPath(MESSAGES[lang], full);
      if (val == null) val = getPath(MESSAGES[DEFAULT], full); // fall back to English
      if (typeof val !== 'string') return key; // last resort: the key itself
      return interpolate(val, values);
    },
    [lang, namespace],
  );
}
