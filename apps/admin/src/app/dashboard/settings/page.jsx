'use client';

import { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Globe,
  Check,
  Settings as SettingsIcon,
  Palette,
  Languages,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useThemeStore } from '@/store/themeStore';
import { useLanguageStore, LANGUAGES } from '@/store/languageStore';

const THEME_OPTIONS = [
  {
    id: 'light',
    labelKey: 'light',
    descKey: 'lightDesc',
    icon: Sun,
    preview: 'bg-gradient-to-br from-white to-gray-100 border-gray-200',
    accent: 'text-amber-500',
  },
  {
    id: 'dark',
    labelKey: 'dark',
    descKey: 'darkDesc',
    icon: Moon,
    preview: 'bg-gradient-to-br from-slate-800 to-slate-950 border-slate-700',
    accent: 'text-indigo-300',
  },
  {
    id: 'system',
    labelKey: 'system',
    descKey: 'systemDesc',
    icon: Monitor,
    preview: 'bg-gradient-to-br from-white via-gray-200 to-slate-900 border-gray-300',
    accent: 'text-teal-500',
  },
];

export default function SettingsPage() {
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const t = useTranslations('settings');
  const tTheme = useTranslations('settings.theme');
  const tLang = useTranslations('settings.language');

  const [themeChoice, setThemeChoice] = useState(currentTheme);

  const handleThemeSelect = (id) => {
    setThemeChoice(id);
    if (id === 'system') {
      const prefersDark =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    } else {
      setTheme(id);
    }
    toast.success(tTheme('toast', { theme: tTheme(id) }));
  };

  const handleLanguageSelect = (code) => {
    setLanguage(code);
    const lang = LANGUAGES.find((l) => l.code === code);
    toast.success(tLang('toast', { lang: lang?.label ?? code }));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start gap-4">
        <span className="inline-flex w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 items-center justify-center text-teal-600 dark:text-teal-300">
          <SettingsIcon className="w-6 h-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>
      </div>

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <span className="inline-flex w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 items-center justify-center text-indigo-600 dark:text-indigo-300">
            <Palette className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('appearance.title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('appearance.subtitle')}</p>
          </div>
        </header>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEME_OPTIONS.map(({ id, labelKey, descKey, icon: Icon, preview, accent }) => {
            const active = themeChoice === id;
            const label = tTheme(labelKey);
            const desc = tTheme(descKey);
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleThemeSelect(id)}
                className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
                  active
                    ? 'border-teal-500 ring-4 ring-teal-500/15 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 inline-flex w-6 h-6 rounded-full bg-teal-500 text-white items-center justify-center">
                    <Check className="w-4 h-4" />
                  </span>
                )}
                <div
                  className={`h-24 rounded-xl border ${preview} flex items-center justify-center`}
                >
                  <Icon className={`w-8 h-8 ${accent}`} />
                </div>
                <div className="mt-3">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <span className="inline-flex w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 items-center justify-center text-emerald-600 dark:text-emerald-300">
            <Languages className="w-4 h-4" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {tLang('title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{tLang('subtitle')}</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[11px] font-semibold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> {tLang('comingSoon')}
          </span>
        </header>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageSelect(lang.code)}
                className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  active
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-900/15 ring-2 ring-teal-500/15'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-3xl leading-none">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {lang.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir={lang.dir}>
                    {lang.native} · {lang.dir.toUpperCase()}
                  </div>
                </div>
                {active ? (
                  <span className="inline-flex w-6 h-6 rounded-full bg-teal-500 text-white items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-xs uppercase tracking-widest text-gray-400">
                    {lang.code}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <footer className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Globe className="w-3.5 h-3.5" />
            {tLang('footnote')}
          </div>
        </footer>
      </section>
    </div>
  );
}
