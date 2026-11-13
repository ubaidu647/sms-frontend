'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronDown, Menu, MessageCircle, X } from 'lucide-react';
import LandingIcon from './LandingIcon';
import { PORTALS, WA_DEMO } from './landingData';

const LINKS = [
  { href: '#new', label: "What's new" },
  { href: '#features', label: 'Features' },
  { href: '#modules', label: 'Modules' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

const WEB_PORTALS = PORTALS.filter((p) => p.href);

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [portalsOpen, setPortalsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open && !portalsOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setPortalsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, portalsOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'bg-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,145,142,0.12),0_8px_24px_-12px_rgba(0,76,74,0.25)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-[72px] flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Mizenzo School home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            className="w-10 h-10 lg:w-11 lg:h-11 object-contain"
          />
          <span className="leading-none">
            <span className="block text-lg font-extrabold tracking-tight text-slate-900">
              Mizenzo
            </span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600">
              School
            </span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-full hover:text-teal-700 hover:bg-teal-50 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <div className="relative">
            <button
              type="button"
              aria-expanded={portalsOpen}
              aria-haspopup="true"
              onClick={() => setPortalsOpen((v) => !v)}
              onBlur={(e) => {
                if (!e.currentTarget.parentElement.contains(e.relatedTarget)) setPortalsOpen(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full hover:text-teal-700 hover:bg-teal-50 transition-colors"
            >
              Portals
              <ChevronDown
                className={`w-4 h-4 transition-transform ${portalsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {portalsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-teal-900/10">
                {WEB_PORTALS.map((p) => (
                  <a
                    key={p.key}
                    href={p.href}
                    className="flex items-start gap-3 rounded-xl p-3 hover:bg-teal-50 transition-colors"
                  >
                    <span className="grid place-items-center w-9 h-9 rounded-lg bg-teal-600 text-white shrink-0">
                      <LandingIcon name={p.icon} className="w-[18px] h-[18px]" />
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900">{p.title}</span>
                      <span className="block text-xs text-slate-500 leading-snug">{p.who}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/signin"
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-700 transition-colors"
          >
            Login
          </Link>
          <a
            href={WA_DEMO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-lg shadow-teal-600/25 transition-all hover:-translate-y-0.5"
          >
            <MessageCircle className="w-4 h-4" />
            Free demo
          </a>
        </div>

        <button
          type="button"
          className="lg:hidden grid place-items-center w-10 h-10 rounded-full text-slate-700 hover:bg-teal-50"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-teal-900/10 bg-white px-4 pb-6 pt-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col text-base font-medium text-slate-700">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 border-b border-slate-100"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Portals
          </p>
          <div className="grid gap-2">
            {WEB_PORTALS.map((p) => (
              <a
                key={p.key}
                href={p.href}
                className="flex items-center gap-3 rounded-xl p-3 bg-teal-50/60 hover:bg-teal-50"
              >
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-teal-600 text-white shrink-0">
                  <LandingIcon name={p.icon} className="w-[18px] h-[18px]" />
                </span>
                <span className="font-semibold text-slate-900">{p.title}</span>
                <ArrowRight className="w-4 h-4 ml-auto text-teal-600" />
              </a>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/signin"
              className="text-center py-3 rounded-full border border-teal-600 text-teal-700 font-semibold"
            >
              Login
            </Link>
            <a
              href={WA_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center py-3 rounded-full bg-teal-600 text-white font-semibold"
            >
              Free demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
