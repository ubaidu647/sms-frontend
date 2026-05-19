'use client';

import Link from 'next/link';
import { useTokenStore } from '@/store/tokenStore';
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  Wallet,
  BookOpen,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Star,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const accessToken = useTokenStore((s) => s.accessToken);
  const hasHydrated = useTokenStore((s) => s.hasHydrated);
  const isAuthed = hasHydrated && !!accessToken;

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* ───────────────────────── Top Nav ───────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-gray-200/60 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-600/30 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Node<span className="text-teal-600">Campus</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-teal-600 transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-teal-600 transition-colors">Testimonials</a>
            <a href="#contact" className="hover:text-teal-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthed ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition-all"
              >
                Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-teal-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition-all"
                >
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Open menu"
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200/60 dark:border-white/10 px-4 py-3 flex flex-col gap-2 text-sm font-medium">
            <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#testimonials" onClick={() => setMobileOpen(false)}>Testimonials</a>
            <a href="#contact" onClick={() => setMobileOpen(false)}>Contact</a>
          </div>
        )}
      </header>

      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80rem] h-[40rem] bg-gradient-to-br from-teal-100 via-white to-yellow-50 dark:from-teal-900/30 dark:via-transparent dark:to-yellow-900/10 blur-3xl opacity-70" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,145,142,0.12),transparent_50%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-semibold border border-teal-200/60 dark:border-teal-700/40">
                <Sparkles className="w-3.5 h-3.5" />
                Built for modern schools
              </div>
              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Run your entire school from{' '}
                <span className="bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
                  one place
                </span>
              </h1>
              <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 max-w-xl">
                Node Campus is the all-in-one platform for admissions, attendance, fees, exams and
                day-to-day operations — for branches big and small.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={isAuthed ? '/dashboard' : '/signin'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/30 hover:shadow-teal-600/40 transition-all"
                >
                  {isAuthed ? 'Open dashboard' : 'Start free trial'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold transition-all"
                >
                  See features
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> No credit card</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> 14-day trial</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Cancel anytime</div>
              </div>
            </div>

            {/* Dashboard mock */}
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-teal-400/30 to-yellow-200/30 dark:from-teal-700/20 dark:to-yellow-700/10 blur-2xl rounded-3xl -z-10" />
              <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-3 text-xs text-gray-500">app.nodecampus.online/dashboard</div>
                </div>
                <div className="p-5 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Students', value: '2,418', tone: 'teal' },
                    { label: 'Attendance', value: '96%', tone: 'yellow' },
                    { label: 'Fees collected', value: 'Rs 1.84M', tone: 'teal' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl p-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5"
                    >
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">{s.label}</div>
                      <div
                        className={`mt-1 text-xl font-bold ${
                          s.tone === 'teal' ? 'text-teal-600' : 'text-yellow-500'
                        }`}
                      >
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <div className="rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold">Weekly attendance</div>
                      <div className="text-xs text-gray-500">This week</div>
                    </div>
                    <div className="flex items-end gap-2 h-24">
                      {[60, 75, 55, 90, 80, 95, 70].map((h, i) => (
                        <div key={i} className="flex-1 rounded-md bg-gradient-to-t from-teal-600 to-teal-300" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Logos / trust ───────────────────────── */}
      <section className="border-y border-gray-200/60 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-gray-400 dark:text-gray-500 text-sm font-semibold tracking-wider uppercase">
          <span>Trusted by 200+ schools</span>
          <span className="hidden sm:inline">•</span>
          <span>50,000+ students managed</span>
          <span className="hidden sm:inline">•</span>
          <span>99.9% uptime</span>
        </div>
      </section>

      {/* ───────────────────────── Features ───────────────────────── */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Features</div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
              Everything your school needs, nothing it doesn&apos;t
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              From the front desk to the finance office, Node Campus replaces a stack of spreadsheets
              with one fast, modern workspace.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] p-6 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-xl hover:shadow-teal-600/10 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Stats ───────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">{s.value}</div>
              <div className="mt-2 text-teal-100 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── How it works ───────────────────────── */}
      <section id="how" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-teal-600 uppercase tracking-wider">How it works</div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
              Go live in days, not months
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">
              Setup is guided end-to-end. Most schools migrate their data and onboard staff inside a week.
            </p>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] p-6"
              >
                <div className="absolute -top-4 left-6 w-9 h-9 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-teal-600/40">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Testimonials ───────────────────────── */}
      <section id="testimonials" className="py-20 lg:py-28 bg-gray-50/60 dark:bg-white/[0.02] border-y border-gray-200/60 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Loved by educators</div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
              What schools are saying
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <figure
                key={t.author}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] p-6 shadow-sm"
              >
                <div className="flex items-center gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-gray-700 dark:text-gray-200 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold">
                    {t.author[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.author}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── Final CTA ───────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 p-10 lg:p-14 text-white">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-yellow-300/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-teal-300/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Ready to modernize your school?
                </h2>
                <p className="mt-4 text-teal-50/90">
                  Join hundreds of schools running smoother days with Node Campus.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link
                  href={isAuthed ? '/dashboard' : '/signin'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-teal-700 font-semibold shadow-lg hover:bg-yellow-100 transition-colors"
                >
                  {isAuthed ? 'Open dashboard' : 'Start free trial'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 font-semibold transition-colors"
                >
                  Book a demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer id="contact" className="border-t border-gray-200/60 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-600/30">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Node<span className="text-teal-600">Campus</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-md">
              A modern school management platform — admissions, attendance, fees, exams, and reports
              in one place.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Product</div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#features" className="hover:text-teal-600">Features</a></li>
              <li><a href="#how" className="hover:text-teal-600">How it works</a></li>
              <li><a href="#testimonials" className="hover:text-teal-600">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Contact</div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="mailto:hello@nodecampus.online" className="hover:text-teal-600">
                  hello@nodecampus.online
                </a>
              </li>
              <li>
                <a href="mailto:support@nodecampus.online" className="hover:text-teal-600">
                  support@nodecampus.online
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/923109721647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-teal-600"
                >
                  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  </svg>
                  +92 310 9721647
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200/60 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>© {new Date().getFullYear()} Node Campus. All rights reserved.</div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-teal-600">Privacy</a>
              <a href="#" className="hover:text-teal-600">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Users,
    title: 'Student & staff records',
    desc: 'A single source of truth for every profile, document, and timeline event.',
  },
  {
    icon: ClipboardCheck,
    title: 'Attendance & exams',
    desc: 'Daily attendance, exam schedules, marksheets, and report cards — all automated.',
  },
  {
    icon: Wallet,
    title: 'Fees & finance',
    desc: 'Invoices, payment links, dues tracking, and full ledger views for every student.',
  },
  {
    icon: BookOpen,
    title: 'Classes & timetable',
    desc: 'Build classes, sections, subjects, and timetables that everyone stays in sync with.',
  },
  {
    icon: BarChart3,
    title: 'Reports & insights',
    desc: 'Visualize collection trends, attendance dips, and performance — at a glance.',
  },
  {
    icon: Shield,
    title: 'Role-based access',
    desc: 'Fine-grained permissions for admins, teachers, accountants, and parents.',
  },
];

const stats = [
  { value: '200+', label: 'Schools onboarded' },
  { value: '50K+', label: 'Students managed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
];

const steps = [
  {
    title: 'Sign up & invite your team',
    desc: 'Create your school workspace in minutes and invite admins, teachers, and accountants.',
  },
  {
    title: 'Import your data',
    desc: 'Upload students, classes, and fee structures from spreadsheets — or start fresh.',
  },
  {
    title: 'Go live',
    desc: 'Start taking attendance, collecting fees, and running exams from day one.',
  },
];

const testimonials = [
  {
    quote:
      'We replaced four different tools with Node Campus. Our front office is calmer, our parents are happier.',
    author: 'Anita Mehra',
    role: 'Principal, Greenwood Public School',
  },
  {
    quote:
      'Fee collection went from a monthly nightmare to a Monday morning task. The reports alone are worth it.',
    author: 'Rajesh Iyer',
    role: 'Accounts Head, Sunrise Academy',
  },
  {
    quote:
      'Setup was genuinely easy. Our teachers were taking attendance on the mobile view inside a week.',
    author: 'Farah Khan',
    role: 'Vice Principal, Horizon Schools',
  },
];
