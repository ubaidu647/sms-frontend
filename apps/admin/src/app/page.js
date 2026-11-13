import Link from 'next/link';
import { ArrowRight, Check, Mail, MessageCircle, Phone, Sparkles } from 'lucide-react';

import '@/component/landing/landing.css';
import AuthRedirect from '@/component/landing/AuthRedirect';
import HeroArt from '@/component/landing/HeroArt';
import LandingIcon from '@/component/landing/LandingIcon';
import LandingNav from '@/component/landing/LandingNav';
import Pricing from '@/component/landing/Pricing';
import {
  CONTACT,
  FAQS,
  FEATURES,
  HERO_ICONS,
  LAUNCH_OFFER,
  MODULES,
  PLANS,
  PORTALS,
  SPLITS,
  STATS,
  WA_DEMO,
  WHATS_NEW,
} from '@/component/landing/landingData';

export const metadata = {
  title: 'Mizenzo School — School Management System in Pakistan',
  description:
    'Admissions, attendance, timetable, exams, fees, payroll, transport, library, certificates and WhatsApp alerts — with school, student and parent portals and an Android app. Plans from Rs 1,500 a month.',
};

const lowestOffer = Math.min(...PLANS.map((p) => p.offerPrice));

const TONE = {
  ok: 'bg-emerald-50 text-emerald-700',
  warn: 'bg-amber-50 text-amber-700',
  info: 'bg-teal-50 text-teal-700',
};

function SectionHead({ eyebrow, title, sub, light = false }) {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <p
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
          light ? 'bg-white/10 text-amber-300' : 'bg-teal-50 text-teal-700'
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}
      >
        {title}
      </h2>
      {sub && (
        <p className={`mt-4 text-lg ${light ? 'text-teal-50/80' : 'text-slate-600'}`}>{sub}</p>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <AuthRedirect />
      <LandingNav />

      <main>
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="relative pt-28 lg:pt-32 pb-16 lg:pb-24">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-teal-100/70 blur-3xl" />
            <div className="absolute top-20 -right-40 w-[480px] h-[480px] rounded-full bg-amber-100/60 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(#00918e14_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[1.02fr_1fr] gap-12 lg:gap-10 items-center">
            <div className="lp-rise min-w-0">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-white pl-1.5 pr-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-teal-900/10 hover:ring-teal-600/40 transition"
              >
                <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                  Launch offer
                </span>
                First {LAUNCH_OFFER.maxSchools} schools from Rs{' '}
                {lowestOffer.toLocaleString('en-PK')}/month
                <ArrowRight className="w-4 h-4 text-teal-600" />
              </a>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Mizenzo School
                <span className="lp-shine block pb-1">for a Smarter Tomorrow</span>
              </h1>
              <p className="mt-6 text-lg text-slate-600 max-w-xl">
                Students, staff, attendance, fees, exams and more — all in one easy-to-use system,
                with portals for parents and students and an Android app for everyone.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={WA_DEMO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xl shadow-teal-600/25 transition-all hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  Book a free demo
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-teal-700 font-semibold ring-1 ring-teal-600/30 hover:ring-teal-600 transition-all"
                >
                  See pricing
                  <ArrowRight className="w-5 h-5" />
                </a>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 px-4 py-3.5 font-semibold text-slate-700 hover:text-teal-700"
                >
                  School login
                </Link>
              </div>

              <ul className="mt-10 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {HERO_ICONS.map((h) => (
                  <li key={h.label} className="flex flex-col items-center text-center gap-2">
                    <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white text-teal-600 shadow-md shadow-teal-900/5 ring-1 ring-teal-900/10">
                      <LandingIcon name={h.icon} className="w-6 h-6" />
                    </span>
                    <span className="text-xs font-medium text-slate-600 leading-tight">
                      {h.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lp-rise min-w-0 [animation-delay:150ms]">
              <HeroArt />
            </div>
          </div>
        </section>

        {/* ───────────────────────── Stats ───────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-3xl bg-teal-900/10 ring-1 ring-teal-900/10">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-6 py-7 text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-teal-600">{s.value}</div>
                <div className="mt-1 text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────────────────── What's new ───────────────────────── */}
        <section id="new" className="scroll-mt-20 py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow={
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Just added
                </>
              }
              title="New in Mizenzo School"
              sub="The modules schools asked for most — built, tested and running today."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {WHATS_NEW.map((f) => (
                <article
                  key={f.title}
                  className="group relative rounded-3xl bg-white p-6 ring-1 ring-teal-900/10 shadow-sm hover:shadow-xl hover:shadow-teal-900/10 hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="absolute top-5 right-5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    New
                  </span>
                  <span className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-600/25 group-hover:scale-105 transition-transform">
                    <LandingIcon name={f.icon} className="w-6 h-6" />
                  </span>
                  <h3 className="mt-5 font-bold text-lg text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── Features ───────────────────────── */}
        <section
          id="features"
          className="scroll-mt-20 py-20 lg:py-28 bg-gradient-to-b from-teal-50/70 to-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow="Features"
              title="Everything a school office does before lunch."
              sub="One system, one database, real transactions across modules — so a fee posting and a ledger entry can never half-happen."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="rounded-3xl bg-white/80 backdrop-blur p-6 ring-1 ring-teal-900/10 hover:ring-teal-600/40 hover:bg-white transition-all"
                >
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-teal-50 text-teal-600">
                    <LandingIcon name={f.icon} className="w-5 h-5" />
                  </span>
                  <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── Splits ───────────────────────── */}
        <section className="py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            {SPLITS.map((s) => (
              <div key={s.title} className="grid lg:grid-cols-2 gap-12 items-center">
                <div className={s.reversed ? 'lg:order-2' : ''}>
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-600">
                    {s.eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                    {s.title}
                  </h2>
                  <p className="mt-4 text-slate-600 leading-relaxed">{s.body}</p>
                  <ul className="mt-6 space-y-3">
                    {s.checks.map(([bold, rest]) => (
                      <li key={bold} className="flex items-start gap-3 text-slate-700">
                        <span className="mt-0.5 grid place-items-center w-5 h-5 rounded-full bg-teal-600 text-white shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <span>
                          <b className="text-slate-900">{bold}</b>
                          {rest}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`relative ${s.reversed ? 'lg:order-1' : ''}`}>
                  <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-teal-100 to-amber-50 -z-10 rotate-1" />
                  <div className="rounded-3xl bg-white p-6 shadow-xl shadow-teal-900/10 ring-1 ring-teal-900/10">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                      <span className="ml-2 text-sm font-semibold text-slate-700">
                        {s.panel.title}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {s.panel.rows.map((r) => (
                        <li key={r.title} className="flex items-center gap-4 py-4">
                          <span className="grid place-items-center w-11 h-11 rounded-xl bg-teal-600 text-white text-sm font-bold shrink-0">
                            {r.av}
                          </span>
                          <span className="flex-1 min-w-0">
                            <b className="block text-slate-900">{r.title}</b>
                            <span className="block text-sm text-slate-500 truncate">{r.sub}</span>
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                              r.tone ? TONE[r.tone] : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            {r.amt}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────────────────────── Portals ───────────────────────── */}
        <section className="relative py-20 lg:py-28 bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 overflow-hidden">
          <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead
              light
              eyebrow="One school, four doors"
              title="A portal for everyone in the school."
              sub="Staff, students and parents each sign in to their own space — all running on the same live data."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PORTALS.map((p) => {
                const body = (
                  <>
                    <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white text-teal-700">
                      <LandingIcon name={p.icon} className="w-6 h-6" />
                    </span>
                    <h3 className="mt-5 font-bold text-lg text-white">{p.title}</h3>
                    <p className="mt-2 text-sm text-teal-50/75 leading-relaxed">{p.who}</p>
                    {p.href ? (
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300">
                        Open <ArrowRight className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="mt-5 inline-flex text-sm font-semibold text-amber-300">
                        Ask us for the app
                      </span>
                    )}
                  </>
                );
                const cls =
                  'block rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur hover:bg-white/15 hover:-translate-y-1 transition-all';
                if (!p.href) {
                  return (
                    <a
                      key={p.key}
                      href={WA_DEMO}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cls}
                    >
                      {body}
                    </a>
                  );
                }
                return p.href.startsWith('/') ? (
                  <Link key={p.key} href={p.href} className={cls}>
                    {body}
                  </Link>
                ) : (
                  <a key={p.key} href={p.href} className={cls}>
                    {body}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* ───────────────────────── Modules ───────────────────────── */}
        <section id="modules" className="scroll-mt-20 py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow="Modules"
              title="Not a roadmap — all of it is built and running."
              sub="Every module below works today, for every branch of your school."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MODULES.map((g) => (
                <div
                  key={g.title}
                  className="rounded-3xl p-6 bg-slate-50/80 ring-1 ring-slate-200/70"
                >
                  <h3 className="font-bold text-teal-700">{g.title}</h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {g.items.map((i) => (
                      <li
                        key={i}
                        className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200"
                      >
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── Pricing ───────────────────────── */}
        <section
          id="pricing"
          className="scroll-mt-20 py-20 lg:py-28 bg-gradient-to-b from-teal-50/80 via-white to-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead
              eyebrow="Pricing"
              title="Simple monthly plans. No per-student surprises."
              sub={`Launch offer for the first ${LAUNCH_OFFER.maxSchools} schools — the offer price stays locked for a full year. Pay yearly and get two months free.`}
            />
            <div className="mt-12">
              <Pricing />
            </div>
          </div>
        </section>

        {/* ───────────────────────── FAQ ───────────────────────── */}
        <section id="faq" className="scroll-mt-20 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHead eyebrow="FAQ" title="Questions schools ask us" />
            <div className="mt-12 space-y-3">
              {FAQS.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-2xl bg-white ring-1 ring-slate-200 open:ring-teal-600/40 open:shadow-lg open:shadow-teal-900/5 transition-all"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="grid place-items-center w-7 h-7 rounded-full bg-teal-50 text-teal-700 text-lg leading-none shrink-0 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 -mt-1 text-slate-600 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── CTA ───────────────────────── */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative max-w-6xl mx-auto overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 px-6 py-14 sm:px-14 text-center text-white">
            <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-amber-300/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-teal-300/25 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-light.png"
              alt=""
              width={88}
              height={88}
              className="relative mx-auto w-20 h-20 object-contain drop-shadow-xl"
            />
            <h2 className="relative mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Poora school, ek system mein.
            </h2>
            <p className="relative mt-4 max-w-2xl mx-auto text-teal-50/85 text-lg">
              Tell us how many students and campuses you run, and we will walk you through the
              school portal, the parent portal and the Android app on your own screen.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={WA_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold shadow-xl transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp {CONTACT.phoneDisplay}
              </a>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/30 font-semibold transition-colors"
              >
                School login
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="bg-teal-950 text-teal-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-light.png"
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
              />
              <span className="leading-none">
                <span className="block text-xl font-extrabold text-white">Mizenzo</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                  School
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed">
              School management for Pakistan — admissions, attendance, fees, exams, payroll and
              parent communication in one system. A product of Mizenzo Solutions.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                ['#new', "What's new"],
                ['#features', 'Features'],
                ['#pricing', 'Pricing'],
                ['#faq', 'FAQ'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="hover:text-amber-300 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
              {PORTALS.filter((p) => p.href).map((p) => (
                <li key={p.key}>
                  <a href={p.href} className="hover:text-amber-300 transition-colors">
                    {p.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={WA_DEMO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-amber-300"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phoneE164}`}
                  className="inline-flex items-center gap-2 hover:text-amber-300"
                >
                  <Phone className="w-4 h-4" /> {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="inline-flex items-center gap-2 hover:text-amber-300 break-all"
                >
                  <Mail className="w-4 h-4 shrink-0" /> {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-teal-50/60">
            <p>© {new Date().getFullYear()} Mizenzo Solutions. All rights reserved.</p>
            <a href={CONTACT.website} className="hover:text-amber-300">
              mizenzo.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
