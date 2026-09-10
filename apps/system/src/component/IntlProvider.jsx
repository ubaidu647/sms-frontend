'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useLanguageStore, LANGUAGES } from '@/store/languageStore';
import en from '@/locales/en.json';
import ur from '@/locales/ur.json';
import ar from '@/locales/ar.json';

const MESSAGES = { en, ur, ar };
const DEFAULT_LOCALE = 'en';

export default function IntlProvider({ children }) {
  const language = useLanguageStore((s) => s.language);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const lang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
    document.documentElement.lang = lang.code;
    // Force LTR globally — flipping the whole document mirrors the existing
    // LTR-designed layout (sidebar, tables, pagination). RTL text still renders
    // correctly inside LTR containers via Unicode bidi. Set explicitly each
    // time so any leftover dir="rtl" from prior renders gets cleared.
    document.documentElement.dir = 'ltr';
  }, [language, mounted]);

  // Until mounted, render with the SSR default so the initial markup matches.
  const locale = mounted ? language : DEFAULT_LOCALE;
  const messages = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
