'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  ChevronDown,
  LayoutGrid,
  GraduationCap,
  Check,
  Users,
  CalendarCheck,
  Wallet,
  BookOpen,
  Sparkles,
  ArrowUpRight,
  Clock,
  Star,
  Activity,
  Heart,
  Bookmark,
  Sun,
  Pin,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';

const GENERAL_STATS = [
  {
    title: 'Fees Awaiting Payment',
    value: '9/59',
    percent: 74,
    trend: '+14% Inc',
    bg: 'bg-[#2F8F7A]',
  },
  {
    title: 'Converted Leads',
    value: '2/10',
    percent: 74,
    trend: '+14% Inc',
    bg: 'bg-[#E0A328]',
  },
  {
    title: 'Staff Present Today',
    value: '0/8',
    percent: 74,
    trend: '+14% Inc',
    bg: 'bg-[#D94A2A]',
  },
  {
    title: 'Student Present Today',
    value: '15/58',
    percent: 74,
    trend: '+14% Inc',
    bg: 'bg-[#2E6BE6]',
  },
];

const CLASS_1 = {
  name: 'Class 1 — Section A',
  students: 32,
  present: 28,
  avgMarks: 78,
  feesPending: 4,
};

const VIEW_OPTIONS = [
  { id: 'general-1', label: 'General 1', group: 'general' },
  { id: 'general-2', label: 'General 2', group: 'general' },
  { id: 'general-3', label: 'General 3', group: 'general' },
  { id: 'general-4', label: 'General 4', group: 'general' },
  { id: 'general-5', label: 'General 5', group: 'general' },
  { id: 'general-6', label: 'General 6', group: 'general' },
  { id: 'general-7', label: 'General 7', group: 'general' },
  { id: 'class-1', label: 'Class 1 Design 1', group: 'class' },
  { id: 'class-2', label: 'Class 1 Design 2', group: 'class' },
  { id: 'class-3', label: 'Class 1 Design 3', group: 'class' },
  { id: 'class-4', label: 'Class 1 Design 4', group: 'class' },
  { id: 'class-5', label: 'Class 1 Design 5', group: 'class' },
  { id: 'class-6', label: 'Class 1 Design 6', group: 'class' },
  { id: 'class-7', label: 'Class 1 Design 7', group: 'class' },
];

/* ────────── shared helpers ────────── */

function Sparkline({ data, stroke, fill, height = 100 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 40;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / range) * h]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <polygon points={area} fill={fill} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StatCard({ title, value, percent, trend, bg }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={`${bg} rounded-2xl p-5 text-white flex items-center justify-between shadow-sm`}>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-white/90">{title}</p>
        <p className="text-3xl font-bold leading-none">{value}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/25">
            <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
          </span>
          <span className="text-xs font-medium text-white/90">{trend}</span>
        </div>
      </div>

      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="6"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold">+{percent}%</span>
        </div>
      </div>
    </div>
  );
}

function ViewSwitcher({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = VIEW_OPTIONS.find((o) => o.id === value);
  const isGeneral = selected?.group === 'general';
  const Icon = isGeneral ? LayoutGrid : GraduationCap;

  const generals = VIEW_OPTIONS.filter((o) => o.group === 'general');
  const classes = VIEW_OPTIONS.filter((o) => o.group === 'class');

  return (
    <div ref={ref} className="relative w-72">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-teal-50 dark:bg-teal-900/40">
            <Icon className="w-4 h-4 text-teal-600 dark:text-teal-300" />
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {selected?.label || 'Select'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[28rem] overflow-y-auto">
          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            General
          </div>
          {generals.map((o) => {
            const active = value === o.id;
            return (
              <button
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                  active ? 'bg-teal-50 dark:bg-slate-700/60' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-teal-600 dark:text-teal-300" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {o.label}
                  </span>
                </div>
                {active && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            );
          })}

          <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-slate-700">
            Classes
          </div>
          {classes.map((o) => {
            const active = value === o.id;
            return (
              <button
                key={o.id}
                onClick={() => {
                  onChange(o.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                  active ? 'bg-teal-50 dark:bg-slate-700/60' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-300" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {o.label}
                  </span>
                </div>
                {active && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── GENERAL 1 (UNCHANGED) ───────────────────────── */

function GeneralView() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {GENERAL_STATS.map((s) => (
        <StatCard key={s.title} {...s} />
      ))}
    </div>
  );
}

/* ───────────────────────── GENERAL 2 — AURORA MESH ───────────────────────── */

function GeneralView2() {
  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-[36px] p-8 text-white min-h-[280px]"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, #f97316 0%, transparent 40%), radial-gradient(circle at 80% 10%, #a855f7 0%, transparent 45%), radial-gradient(circle at 70% 80%, #06b6d4 0%, transparent 50%), radial-gradient(circle at 10% 90%, #ec4899 0%, transparent 45%), linear-gradient(135deg, #312e81, #831843)',
        }}
      >
        <div className="absolute inset-0 backdrop-blur-[80px]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-[11px] font-medium uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Aurora
          </div>
          <h2 className="mt-4 text-5xl font-bold tracking-tight">Good morning.</h2>
          <p className="mt-2 text-white/85 max-w-md text-sm">
            58 students, 8 staff, 12 classes — a quiet Wednesday in progress.
          </p>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Fees', v: '9/59', i: Wallet },
              { l: 'Leads', v: '2/10', i: Sparkles },
              { l: 'Staff', v: '0/8', i: GraduationCap },
              { l: 'Students', v: '15/58', i: Users },
            ].map(({ l, v, i: I }) => (
              <div
                key={l}
                className="rounded-2xl p-4 bg-white/10 backdrop-blur-lg border border-white/20"
              >
                <div className="flex items-center justify-between">
                  <I className="w-4 h-4 text-white/80" />
                  <span className="text-[10px] uppercase tracking-widest text-white/70">{l}</span>
                </div>
                <div className="text-3xl font-bold mt-3">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl p-6 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-slate-800 dark:to-slate-900 border border-white/60 dark:border-slate-700">
          <div className="text-[11px] uppercase tracking-widest text-violet-700 dark:text-violet-300">
            Wave · Last 7 days
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Attendance Aurora
          </div>
          <div className="mt-4">
            <Sparkline
              data={[40, 55, 50, 62, 68, 72, 26]}
              stroke="#a855f7"
              fill="rgba(168,85,247,0.18)"
              height={140}
            />
          </div>
        </div>
        <div className="rounded-3xl p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-white/60 dark:border-slate-700">
          <div className="text-[11px] uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
            Calm Notes
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Today</div>
          <ul className="space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Class 5 leading at 85%
            </li>
            <li className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" /> 2 new admissions
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> 9 fee vouchers due
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── GENERAL 3 — VINTAGE NEWSPAPER ───────────────────────── */

function GeneralView3() {
  return (
    <div
      className="bg-[#fbf6ec] dark:bg-slate-900 border-2 border-stone-300 dark:border-slate-700 rounded-2xl p-8 max-w-5xl mx-auto"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <div className="text-center pb-3 border-b-4 border-double border-stone-700 dark:border-stone-500">
        <div className="text-[10px] uppercase tracking-[0.5em] text-stone-600 dark:text-stone-400">
          Vol. I · Wednesday, 16th May 2026 · Price: Free
        </div>
        <h1
          className="text-5xl md:text-6xl font-bold text-stone-900 dark:text-stone-100 mt-1"
          style={{ letterSpacing: '0.02em' }}
        >
          The School Chronicle
        </h1>
        <div className="text-xs italic text-stone-600 dark:text-stone-400 mt-1">
          ✦ Truth · Discipline · Excellence ✦
        </div>
      </div>

      <div className="text-center text-stone-500 dark:text-stone-400 text-sm py-3 italic border-b border-stone-200 dark:border-slate-700">
        — All the numbers fit to print —
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-300 dark:divide-slate-700 py-5">
        {[
          {
            headline: 'Attendance Holds',
            stat: '15 of 58',
            lede: 'Pupils answered the morning bell. A gentle dip from yesterday, attributable to seasonal flu.',
            tag: 'Page A1',
          },
          {
            headline: 'Coffers Half-Filled',
            stat: '9 Vouchers',
            lede: 'Outstanding fees remain across all branches. Bursar urges parents to settle by Friday.',
            tag: 'Finance',
          },
          {
            headline: 'Two New Pupils',
            stat: '+2',
            lede: 'Admissions desk welcomes two new students this week. Welcome notices posted on the board.',
            tag: 'Admissions',
          },
        ].map((c, i) => (
          <div key={i} className="px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">
              {c.tag}
            </div>
            <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1 leading-tight">
              {c.headline}
            </h3>
            <div className="my-3 text-4xl font-bold text-amber-700 dark:text-amber-400">
              {c.stat}
            </div>
            <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed italic">
              {c.lede}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center text-stone-400 dark:text-stone-500 py-2">✦ ✦ ✦</div>

      <div className="border-t-2 border-double border-stone-700 dark:border-stone-500 pt-4 grid grid-cols-2 md:grid-cols-4 text-center divide-x divide-stone-300 dark:divide-slate-700">
        {[
          { l: 'Students', v: '58' },
          { l: 'Staff', v: '8' },
          { l: 'Classes', v: '12' },
          { l: 'Branches', v: '3' },
        ].map((m) => (
          <div key={m.l} className="px-3">
            <div className="text-3xl font-bold text-stone-900 dark:text-stone-100">{m.v}</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400 mt-1">
              {m.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── GENERAL 4 — TROPICAL BUBBLES ───────────────────────── */

function GeneralView4() {
  const stats = [
    {
      l: 'Students',
      v: '58',
      sub: 'on the roster',
      from: 'from-orange-400',
      to: 'to-pink-500',
      icon: Users,
    },
    {
      l: 'Present',
      v: '15',
      sub: 'today',
      from: 'from-emerald-400',
      to: 'to-teal-500',
      icon: CalendarCheck,
    },
    {
      l: 'Fees Due',
      v: '9',
      sub: 'vouchers',
      from: 'from-amber-400',
      to: 'to-orange-500',
      icon: Wallet,
    },
    {
      l: 'New Leads',
      v: '2',
      sub: 'this week',
      from: 'from-sky-400',
      to: 'to-violet-500',
      icon: Sparkles,
    },
  ];
  return (
    <div className="relative space-y-6">
      <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-pink-200/40 dark:bg-pink-900/20 blur-2xl pointer-events-none" />
      <div className="absolute top-40 -left-16 w-72 h-72 rounded-full bg-cyan-200/40 dark:bg-cyan-900/20 blur-2xl pointer-events-none" />

      <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-[36px] p-7 border border-pink-100 dark:border-slate-700">
        <div className="flex items-center gap-2 text-pink-600 dark:text-pink-300 text-xs uppercase tracking-widest font-semibold">
          <Sun className="w-4 h-4" /> Sunny Day
        </div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          Hello, beautiful day!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          A bright look at how today is going across the school.
        </p>
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ l, v, sub, from, to, icon: I }) => (
          <div
            key={l}
            className={`relative rounded-[36px] bg-gradient-to-br ${from} ${to} text-white p-6 shadow-xl shadow-black/5 overflow-hidden`}
          >
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/15" />
            <div className="absolute right-4 top-4 inline-flex w-10 h-10 rounded-full bg-white/20 items-center justify-center">
              <I className="w-5 h-5" />
            </div>
            <div className="relative">
              <div className="text-[11px] uppercase tracking-widest text-white/85">{l}</div>
              <div className="text-5xl font-extrabold leading-none mt-3">{v}</div>
              <div className="text-xs text-white/85 mt-2">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-[36px] p-7 border border-cyan-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
              Mood · Last 7 Days
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Attendance Rhythm
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-semibold">
            <ArrowUpRight className="w-3 h-3" /> sunny
          </span>
        </div>
        <div className="flex items-end gap-3 h-36">
          {[68, 72, 70, 78, 85, 60, 26].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-full bg-pink-100 dark:bg-slate-700 overflow-hidden flex items-end"
                style={{ height: '110px' }}
              >
                <div
                  className="w-full rounded-full bg-gradient-to-t from-pink-400 via-orange-400 to-amber-300"
                  style={{ height: `${v}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── GENERAL 5 — MONO BRUTAL TYPE ───────────────────────── */

function GeneralView5() {
  const rows = [
    { l: 'STUDENTS PRESENT', v: '15', of: '58', accent: false },
    { l: 'FEES OUTSTANDING', v: '09', of: '59', accent: true },
    { l: 'STAFF ON DUTY', v: '00', of: '08', accent: false },
    { l: 'LEADS CONVERTED', v: '02', of: '10', accent: false },
  ];
  return (
    <div className="bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 rounded-2xl border border-gray-900 dark:border-gray-200 p-8 md:p-12 space-y-10 font-mono">
      <div className="flex items-start justify-between border-b-2 border-gray-900 dark:border-gray-200 pb-4">
        <div>
          <div className="text-[10px] tracking-[0.5em]">— DAILY SHEET —</div>
          <div className="text-[10px] tracking-[0.3em] mt-1 text-gray-500">16 / 05 / 2026</div>
        </div>
        <div className="text-[10px] tracking-[0.3em] text-right">
          KIRAN MODEL
          <br />
          SCHOOL · KARACHI
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.l}
            className="grid grid-cols-12 items-baseline gap-4 border-b border-dashed border-gray-300 dark:border-slate-700 py-3"
          >
            <div className="col-span-12 md:col-span-6 text-xs tracking-[0.25em] text-gray-700 dark:text-gray-300">
              {r.l}
            </div>
            <div className="col-span-8 md:col-span-4">
              <div
                className={`text-7xl md:text-8xl font-bold leading-none tracking-tighter ${
                  r.accent ? 'text-red-600' : ''
                }`}
              >
                {r.v}
              </div>
            </div>
            <div className="col-span-4 md:col-span-2 text-xs tracking-widest text-right text-gray-500">
              / {r.of}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 items-end gap-1 pt-4">
        {[68, 72, 70, 78, 85, 60, 26].map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-full bg-gray-900 dark:bg-gray-200" style={{ height: `${v}px` }} />
            <div className="text-[9px] tracking-widest">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-[10px] tracking-[0.5em] pt-2 border-t-2 border-gray-900 dark:border-gray-200">
        — END OF SHEET —
      </div>
    </div>
  );
}

/* ───────────────────────── GENERAL 6 — POSTCARD STACK ───────────────────────── */

function GeneralView6() {
  const cards = [
    {
      l: 'Students Today',
      v: '15/58',
      tag: 'Karachi · Main',
      tone: 'bg-amber-50',
      stripe: 'bg-amber-500',
      rot: '-rotate-2',
      icon: Users,
    },
    {
      l: 'Fees Cleared',
      v: '50/59',
      tag: 'Finance Desk',
      tone: 'bg-emerald-50',
      stripe: 'bg-emerald-500',
      rot: 'rotate-1',
      icon: Wallet,
    },
    {
      l: 'New Admissions',
      v: '2',
      tag: 'This Week',
      tone: 'bg-rose-50',
      stripe: 'bg-rose-500',
      rot: '-rotate-1',
      icon: Sparkles,
    },
    {
      l: 'Staff On Duty',
      v: '0/8',
      tag: 'Reminder',
      tone: 'bg-sky-50',
      stripe: 'bg-sky-500',
      rot: 'rotate-2',
      icon: GraduationCap,
    },
  ];
  return (
    <div className="space-y-8 px-4">
      <div
        className="relative bg-stone-100 dark:bg-slate-800 rounded-3xl p-7 border border-stone-200 dark:border-slate-700 max-w-3xl mx-auto"
        style={{
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="flex items-center gap-3">
          <Pin className="w-5 h-5 text-rose-500" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">
              The School Pinboard
            </div>
            <h2
              className="text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1"
              style={{ fontFamily: '"Caveat", "Comic Sans MS", cursive' }}
            >
              Today&apos;s notes &amp; numbers
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map(({ l, v, tag, tone, stripe, rot, icon: I }) => (
          <div
            key={l}
            className={`relative ${tone} dark:bg-slate-800 rounded-md p-5 pt-7 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] border border-stone-200 dark:border-slate-700 transform ${rot} hover:rotate-0 transition-transform`}
          >
            <div
              className={`absolute left-1/2 -translate-x-1/2 -top-2 w-10 h-3 ${stripe} rounded-sm shadow-md`}
            />
            <div className="flex items-start justify-between">
              <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500 dark:text-stone-400">
                {tag}
              </div>
              <I className="w-4 h-4 text-stone-400" />
            </div>
            <div className="mt-4 text-stone-900 dark:text-stone-100">
              <div className="text-[11px] uppercase tracking-widest text-stone-600 dark:text-stone-400">
                {l}
              </div>
              <div className="text-4xl font-bold mt-1 tracking-tight">{v}</div>
            </div>
            <div
              className="mt-3 text-xs italic text-stone-500 dark:text-stone-400"
              style={{ fontFamily: '"Caveat", cursive' }}
            >
              keep going ✨
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── GENERAL 7 — DAY/NIGHT SPLIT ───────────────────────── */

function GeneralView7() {
  return (
    <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-700 grid grid-cols-1 lg:grid-cols-2">
      <div className="relative bg-gradient-to-br from-amber-200 via-orange-300 to-pink-300 p-8 text-stone-900 min-h-[420px] overflow-hidden">
        <div className="absolute top-6 right-6 w-20 h-20 rounded-full bg-yellow-300 shadow-[0_0_60px_rgba(253,224,71,0.8)]" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/40 blur-2xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/40 backdrop-blur text-[11px] uppercase tracking-widest font-semibold">
            <Sun className="w-3.5 h-3.5" /> Daylight
          </div>
          <h2 className="text-4xl font-bold mt-4">Live Numbers</h2>
          <p className="text-stone-700 text-sm mt-1 max-w-sm">
            What&apos;s happening right now in the school.
          </p>
          <div className="mt-6 space-y-4">
            {[
              { l: 'Students Present', v: '15 / 58', i: Users },
              { l: 'Staff On Duty', v: '0 / 8', i: GraduationCap },
              { l: 'Open Classes', v: '6', i: Activity },
            ].map(({ l, v, i: I }) => (
              <div
                key={l}
                className="flex items-center justify-between bg-white/40 backdrop-blur rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex w-9 h-9 rounded-xl bg-white/60 items-center justify-center">
                    <I className="w-4 h-4 text-stone-700" />
                  </span>
                  <span className="text-sm font-semibold">{l}</span>
                </div>
                <span className="text-2xl font-bold tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-8 min-h-[420px] overflow-hidden">
        <div className="absolute top-8 right-10 w-16 h-16 rounded-full bg-slate-100 shadow-[0_0_40px_rgba(255,255,255,0.4)]" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              top: `${(i * 53) % 100}%`,
              left: `${(i * 37) % 100}%`,
              opacity: 0.5 + (i % 3) * 0.15,
            }}
          />
        ))}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[11px] uppercase tracking-widest font-semibold text-indigo-200">
            <Bookmark className="w-3.5 h-3.5" /> Evening Brief
          </div>
          <h2 className="text-4xl font-bold mt-4">Recap & Pending</h2>
          <p className="text-indigo-200 text-sm mt-1 max-w-sm">What to wrap up before tomorrow.</p>
          <div className="mt-6 space-y-4">
            {[
              { l: 'Fees Awaiting', v: '9 / 59', i: Wallet, c: '#f472b6' },
              { l: 'Leads to Follow', v: '8 / 10', i: Sparkles, c: '#a78bfa' },
              { l: 'Reports Due', v: '3', i: Bookmark, c: '#22d3ee' },
            ].map(({ l, v, i: I, c }) => (
              <div
                key={l}
                className="flex items-center justify-between bg-white/5 backdrop-blur rounded-2xl px-4 py-3 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: `${c}22`, color: c }}
                  >
                    <I className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-semibold">{l}</span>
                </div>
                <span className="text-2xl font-bold tabular-nums" style={{ color: c }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── CLASS 1 DESIGN 1 (UNCHANGED) ───────────────────────── */

function ClassView({ cls }) {
  const stats = cls;
  const cards = [
    {
      title: 'Total Students',
      value: String(stats.students),
      sub: 'Enrolled this term',
      icon: Users,
      bg: 'bg-[#2E6BE6]',
    },
    {
      title: 'Present Today',
      value: `${stats.present}/${stats.students}`,
      sub: `${Math.round((stats.present / stats.students) * 100)}% attendance`,
      icon: CalendarCheck,
      bg: 'bg-[#2F8F7A]',
    },
    {
      title: 'Average Marks',
      value: `${stats.avgMarks}%`,
      sub: 'Last exam cycle',
      icon: BookOpen,
      bg: 'bg-[#E0A328]',
    },
    {
      title: 'Fees Pending',
      value: `${stats.feesPending}/${stats.students}`,
      sub: 'Students with dues',
      icon: Wallet,
      bg: 'bg-[#D94A2A]',
    },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Overview — {cls.name}
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">Class-specific summary</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ title, value, sub, icon: Icon, bg }) => (
          <div
            key={title}
            className={`${bg} rounded-2xl p-5 text-white shadow-sm flex items-start justify-between`}
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-white/90">{title}</p>
              <p className="text-3xl font-bold leading-none">{value}</p>
              <p className="text-xs text-white/80 mt-1">{sub}</p>
            </div>
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 shrink-0">
              <Icon className="w-5 h-5" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── CLASS 1 DESIGN 2 — SCOREBOARD ───────────────────────── */

function ClassView2({ cls }) {
  const attendancePct = Math.round((cls.present / cls.students) * 100);
  return (
    <div className="rounded-3xl bg-gradient-to-br from-black via-slate-900 to-emerald-950 border-4 border-emerald-700/40 p-6 md:p-8 text-emerald-100 font-mono shadow-2xl shadow-emerald-900/30">
      <div className="flex items-center justify-between border-b-2 border-emerald-700/40 pb-4">
        <div>
          <div className="text-[10px] tracking-[0.5em] text-emerald-400">— LIVE BOARD —</div>
          <div className="text-3xl font-bold text-white mt-1">{cls.name.toUpperCase()}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.3em] text-emerald-400">SHIFT</div>
          <div className="text-2xl font-bold text-amber-300">MORNING</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-emerald-700/30 mt-6 mb-6">
        {[
          { l: 'STUDENTS', v: String(cls.students).padStart(3, '0'), c: 'text-white' },
          { l: 'PRESENT', v: String(cls.present).padStart(3, '0'), c: 'text-emerald-300' },
          { l: 'MARKS AVG', v: `${cls.avgMarks}%`, c: 'text-amber-300' },
          { l: 'DUE', v: String(cls.feesPending).padStart(3, '0'), c: 'text-red-400' },
        ].map((s) => (
          <div key={s.l} className="px-4 text-center">
            <div className="text-[10px] tracking-[0.3em] text-emerald-400">{s.l}</div>
            <div
              className={`text-6xl md:text-7xl font-bold tracking-tighter mt-2 tabular-nums ${s.c}`}
              style={{
                textShadow: '0 0 20px currentColor',
                fontFamily: '"Courier New", monospace',
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-black/50 rounded-2xl border border-emerald-700/30 p-5 grid grid-cols-12 items-center gap-4">
        <div className="col-span-12 md:col-span-4">
          <div className="text-[10px] tracking-[0.3em] text-emerald-400">ATTENDANCE %</div>
          <div
            className="text-5xl font-bold text-emerald-300 mt-1"
            style={{ textShadow: '0 0 25px #10b981' }}
          >
            {attendancePct}%
          </div>
        </div>
        <div className="col-span-12 md:col-span-8">
          <div className="h-3 rounded-full bg-emerald-950 overflow-hidden border border-emerald-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 shadow-[0_0_10px_#10b981]"
              style={{ width: `${attendancePct}%` }}
            />
          </div>
          <div className="grid grid-cols-7 gap-1 mt-3">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="w-full h-12 rounded border border-emerald-800/50 bg-emerald-950/70 flex items-end"
                  title={`Day ${d}`}
                >
                  <div
                    className="w-full bg-emerald-500 shadow-[0_0_8px_#10b981]"
                    style={{
                      height: `${[60, 70, 80, 85, 92, 0, 0][i]}%`,
                      opacity: i < 5 ? 1 : 0.2,
                    }}
                  />
                </div>
                <span className="text-[9px] tracking-widest text-emerald-400">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5 text-[10px] tracking-[0.3em] text-emerald-500">
        <span>● RECORDING</span>
        <span>SYS://CLASS-01-A · OK</span>
      </div>
    </div>
  );
}

/* ───────────────────────── CLASS 1 DESIGN 3 — PERIODIC TABLE ───────────────────────── */

function ClassView3({ cls }) {
  const elements = [
    { num: 1, sym: 'St', name: 'Students', val: cls.students, color: 'bg-blue-500' },
    { num: 2, sym: 'Pr', name: 'Present', val: cls.present, color: 'bg-emerald-500' },
    { num: 3, sym: 'Mk', name: 'Avg Marks', val: `${cls.avgMarks}%`, color: 'bg-amber-500' },
    { num: 4, sym: 'Fe', name: 'Fees Due', val: cls.feesPending, color: 'bg-rose-500' },
    { num: 5, sym: 'Cl', name: 'Classes', val: 6, color: 'bg-violet-500' },
    { num: 6, sym: 'Pe', name: 'Periods', val: 8, color: 'bg-cyan-500' },
    { num: 7, sym: 'Tc', name: 'Teachers', val: 4, color: 'bg-pink-500' },
    { num: 8, sym: 'Hw', name: 'Homework', val: 3, color: 'bg-indigo-500' },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 p-7 text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-gray-500 dark:text-gray-400">
          Classroom Elements
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
          {cls.name}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Eight building blocks of a healthy classroom.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {elements.map((e) => (
          <div
            key={e.sym}
            className="relative rounded-2xl border-2 border-gray-900 dark:border-gray-100 bg-white dark:bg-slate-800 p-4 hover:-translate-y-1 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,0.9)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-mono text-gray-500">
                {String(e.num).padStart(2, '0')}
              </span>
              <span className={`inline-block w-3 h-3 rounded-full ${e.color}`} />
            </div>
            <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 text-center my-3 tracking-tight">
              {e.sym}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{e.val}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                {e.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── CLASS 1 DESIGN 4 — POLAROID GALLERY ───────────────────────── */

function ClassView4({ cls }) {
  const attendancePct = Math.round((cls.present / cls.students) * 100);
  const cards = [
    {
      l: 'Students',
      v: cls.students,
      sub: 'enrolled',
      rot: '-rotate-3',
      color: '#3b82f6',
      icon: Users,
    },
    {
      l: 'Present',
      v: `${attendancePct}%`,
      sub: 'attendance',
      rot: 'rotate-2',
      color: '#10b981',
      icon: CalendarCheck,
    },
    {
      l: 'Marks',
      v: `${cls.avgMarks}%`,
      sub: 'class avg',
      rot: '-rotate-1',
      color: '#f59e0b',
      icon: BookOpen,
    },
    {
      l: 'Fees Due',
      v: cls.feesPending,
      sub: 'pending',
      rot: 'rotate-3',
      color: '#ef4444',
      icon: Wallet,
    },
  ];
  return (
    <div
      className="space-y-8 p-4"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,0.02) 35px, rgba(0,0,0,0.02) 70px)',
      }}
    >
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
          The Class Album
        </div>
        <h2
          className="text-3xl text-gray-900 dark:text-gray-100 mt-1"
          style={{ fontFamily: '"Caveat", cursive' }}
        >
          {cls.name} — moments & numbers
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {cards.map(({ l, v, sub, rot, color, icon: I }) => (
          <div
            key={l}
            className={`relative bg-white dark:bg-slate-100 p-3 pb-6 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.3)] transform ${rot} hover:rotate-0 transition-transform`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-amber-200/70 backdrop-blur-sm border border-amber-300/60 shadow-sm" />
            <div
              className="relative h-32 flex items-center justify-center"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <I className="w-12 h-12" strokeWidth={1.5} />
              <div className="absolute top-2 right-2 text-[10px] font-mono text-gray-500 bg-white/70 px-1.5 py-0.5 rounded">
                {String(Math.floor(Math.random() * 90 + 10))}/365
              </div>
            </div>
            <div className="pt-3 text-center text-stone-900">
              <div className="text-3xl font-bold tracking-tight">{v}</div>
              <div className="text-sm mt-1" style={{ fontFamily: '"Caveat", cursive' }}>
                {l.toLowerCase()} — {sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── CLASS 1 DESIGN 5 — CERTIFICATE ───────────────────────── */

function ClassView5({ cls }) {
  const attendancePct = Math.round((cls.present / cls.students) * 100);
  return (
    <div
      className="relative max-w-4xl mx-auto p-10 rounded-3xl border-[6px] border-amber-700 dark:border-amber-500 bg-[#fdfaf2] dark:bg-slate-900"
      style={{ fontFamily: 'Georgia, serif' }}
    >
      <div className="absolute inset-4 border-2 border-amber-600/50 dark:border-amber-500/40 rounded-2xl pointer-events-none" />
      <div className="absolute top-3 left-3 w-12 h-12 border-t-4 border-l-4 border-amber-700 dark:border-amber-500 rounded-tl-2xl" />
      <div className="absolute top-3 right-3 w-12 h-12 border-t-4 border-r-4 border-amber-700 dark:border-amber-500 rounded-tr-2xl" />
      <div className="absolute bottom-3 left-3 w-12 h-12 border-b-4 border-l-4 border-amber-700 dark:border-amber-500 rounded-bl-2xl" />
      <div className="absolute bottom-3 right-3 w-12 h-12 border-b-4 border-r-4 border-amber-700 dark:border-amber-500 rounded-br-2xl" />

      <div className="relative text-center py-4">
        <div className="text-[11px] tracking-[0.5em] uppercase text-amber-700 dark:text-amber-400">
          ✦ Kiran Model School ✦
        </div>
        <h2 className="text-5xl font-bold text-stone-900 dark:text-stone-100 mt-3">
          Class Summary
        </h2>
        <div className="text-sm italic text-stone-600 dark:text-stone-400 mt-1">
          Awarded with pride to
        </div>
        <div
          className="text-3xl text-amber-700 dark:text-amber-400 mt-3"
          style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive' }}
        >
          {cls.name}
        </div>
      </div>

      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 my-8">
        {[
          { l: 'Students', v: cls.students },
          { l: 'Present', v: `${attendancePct}%` },
          { l: 'Avg Marks', v: `${cls.avgMarks}%` },
          { l: 'Fees Due', v: cls.feesPending },
        ].map((m) => (
          <div key={m.l} className="text-center">
            <div className="text-5xl font-bold text-amber-800 dark:text-amber-300">{m.v}</div>
            <div className="text-[11px] tracking-[0.3em] uppercase text-stone-500 dark:text-stone-400 mt-2">
              {m.l}
            </div>
          </div>
        ))}
      </div>

      <div className="relative text-center text-sm italic text-stone-700 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
        In recognition of consistent effort, an attendance rate of <strong>{attendancePct}%</strong>
        , and an academic average of <strong>{cls.avgMarks}%</strong> this term. May this momentum
        continue.
      </div>

      <div className="relative flex items-end justify-between mt-10 pt-6 border-t border-dashed border-amber-600/40">
        <div className="text-center">
          <div className="border-t border-stone-700 dark:border-stone-300 w-40 pt-1 text-[10px] uppercase tracking-widest text-stone-600 dark:text-stone-400">
            Class Teacher
          </div>
        </div>
        <div className="w-20 h-20 rounded-full border-4 border-double border-amber-700 dark:border-amber-500 flex items-center justify-center text-amber-700 dark:text-amber-400 text-[10px] tracking-widest font-bold">
          KMS
          <br />
          SEAL
        </div>
        <div className="text-center">
          <div className="border-t border-stone-700 dark:border-stone-300 w-40 pt-1 text-[10px] uppercase tracking-widest text-stone-600 dark:text-stone-400">
            Principal
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── CLASS 1 DESIGN 6 — RADIAL SPOTLIGHT ───────────────────────── */

function ClassView6({ cls }) {
  const attendancePct = Math.round((cls.present / cls.students) * 100);
  const orbits = [
    { l: 'Students', v: cls.students, angle: 0, c: '#3b82f6', icon: Users },
    { l: 'Present', v: cls.present, angle: 60, c: '#10b981', icon: CalendarCheck },
    { l: 'Avg Marks', v: `${cls.avgMarks}%`, angle: 120, c: '#f59e0b', icon: BookOpen },
    { l: 'Fees Due', v: cls.feesPending, angle: 180, c: '#ef4444', icon: Wallet },
    { l: 'Subjects', v: 6, angle: 240, c: '#a855f7', icon: Bookmark },
    { l: 'Teachers', v: 4, angle: 300, c: '#06b6d4', icon: GraduationCap },
  ];
  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white p-10 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative flex flex-col items-center">
        <div className="text-[11px] uppercase tracking-[0.4em] text-indigo-200">
          Class Spotlight
        </div>
        <h2 className="text-3xl font-bold mt-1">{cls.name}</h2>

        <div className="relative w-[420px] h-[420px] mt-8">
          <div
            className="absolute inset-0 rounded-full border border-white/10"
            style={{ borderStyle: 'dashed' }}
          />
          <div
            className="absolute inset-10 rounded-full border border-white/10"
            style={{ borderStyle: 'dashed' }}
          />

          <div
            className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 -ml-22 -mt-22 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-[0_0_60px_rgba(217,70,239,0.6)] flex flex-col items-center justify-center"
            style={{ marginLeft: '-88px', marginTop: '-88px' }}
          >
            <div className="text-[10px] uppercase tracking-widest text-white/80">Attendance</div>
            <div className="text-6xl font-bold leading-none mt-1">{attendancePct}%</div>
            <div className="text-xs text-white/80 mt-1">today</div>
          </div>

          {orbits.map((o) => {
            const rad = (o.angle * Math.PI) / 180;
            const radius = 180;
            const x = Math.cos(rad) * radius;
            const y = Math.sin(rad) * radius;
            const I = o.icon;
            return (
              <div
                key={o.l}
                className="absolute top-1/2 left-1/2 w-24 -ml-12"
                style={{ transform: `translate(${x}px, ${y}px) translateY(-50%)` }}
              >
                <div
                  className="rounded-2xl p-3 backdrop-blur bg-white/10 border border-white/15 text-center"
                  style={{ boxShadow: `0 0 24px ${o.c}55` }}
                >
                  <I className="w-4 h-4 mx-auto mb-1" style={{ color: o.c }} />
                  <div className="text-xl font-bold">{o.v}</div>
                  <div className="text-[9px] uppercase tracking-widest text-white/70">{o.l}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── CLASS 1 DESIGN 7 — TICKER TAPE ───────────────────────── */

function ClassView7({ cls }) {
  const attendancePct = Math.round((cls.present / cls.students) * 100);
  const tickers = [
    { l: 'STU', v: cls.students, d: '+2', up: true },
    { l: 'ATT', v: `${attendancePct}%`, d: '-3%', up: false },
    { l: 'AVG', v: `${cls.avgMarks}%`, d: '+4%', up: true },
    { l: 'FEE', v: cls.feesPending, d: '-1', up: true },
    { l: 'HMW', v: 3, d: '0', up: true },
    { l: 'SBJ', v: 6, d: '0', up: true },
    { l: 'TCH', v: 4, d: '+1', up: true },
  ];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-black text-emerald-300 border border-emerald-700/40 overflow-hidden font-mono">
        <div className="flex items-center bg-emerald-950 border-b border-emerald-800 px-4 py-2 text-[10px] tracking-[0.3em]">
          ● LIVE FEED · {cls.name.toUpperCase()} · 16/05/26
        </div>
        <div className="flex overflow-hidden" style={{ animation: 'ticker 30s linear infinite' }}>
          {[...tickers, ...tickers].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-3 whitespace-nowrap border-r border-emerald-800/40"
            >
              <span className="text-emerald-400 text-xs tracking-widest">{t.l}</span>
              <span className="text-white text-xl font-bold">{t.v}</span>
              <span className={`text-xs ${t.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.up ? '▲' : '▼'} {t.d}
              </span>
            </div>
          ))}
        </div>
        <style jsx>{`
          @keyframes ticker {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Intraday · Last 12 sessions
              </div>
              <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Performance Tape
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">LIVE</span>
            </div>
          </div>
          <Sparkline
            data={[60, 65, 72, 68, 75, 80, 78, 82, 85, 88, 84, attendancePct]}
            stroke="#10b981"
            fill="rgba(16,185,129,0.15)"
            height={160}
          />
        </div>
        <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Quote
          </div>
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Best Performers
          </div>
          <table className="w-full text-sm">
            <tbody>
              {[
                { n: 'Ayesha A.', s: '92%', up: true },
                { n: 'Bilal K.', s: '88%', up: true },
                { n: 'Hina S.', s: '85%', up: false },
                { n: 'Usman T.', s: '80%', up: true },
              ].map((s) => (
                <tr
                  key={s.n}
                  className="border-t border-gray-100 dark:border-slate-700 first:border-t-0"
                >
                  <td className="py-2 text-gray-700 dark:text-gray-300">{s.n}</td>
                  <td className="py-2 text-right font-bold text-gray-900 dark:text-gray-100">
                    {s.s}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <span
                      className={`text-xs font-mono ${s.up ? 'text-emerald-600' : 'text-rose-600'}`}
                    >
                      {s.up ? '▲' : '▼'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Subject Index
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500">Volume × Score</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { n: 'MATH', v: 82, c: '#3b82f6' },
            { n: 'ENG', v: 76, c: '#10b981' },
            { n: 'SCI', v: 88, c: '#f59e0b' },
            { n: 'URD', v: 71, c: '#ef4444' },
            { n: 'SST', v: 79, c: '#a855f7' },
          ].map((s) => (
            <div
              key={s.n}
              className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 border-l-4"
              style={{ borderLeftColor: s.c }}
            >
              <div className="text-[10px] font-mono text-gray-500">{s.n}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.v}</div>
              <div className="text-[10px] text-gray-500">avg %</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── ROOT ───────────────────────── */

export default function SchoolDashboard() {
  const { user } = useUserStore();
  const [view, setView] = useState('general-1');

  let body = null;
  if (view === 'general-1') body = <GeneralView />;
  else if (view === 'general-2') body = <GeneralView2 />;
  else if (view === 'general-3') body = <GeneralView3 />;
  else if (view === 'general-4') body = <GeneralView4 />;
  else if (view === 'general-5') body = <GeneralView5 />;
  else if (view === 'general-6') body = <GeneralView6 />;
  else if (view === 'general-7') body = <GeneralView7 />;
  else if (view === 'class-1') body = <ClassView cls={CLASS_1} />;
  else if (view === 'class-2') body = <ClassView2 cls={CLASS_1} />;
  else if (view === 'class-3') body = <ClassView3 cls={CLASS_1} />;
  else if (view === 'class-4') body = <ClassView4 cls={CLASS_1} />;
  else if (view === 'class-5') body = <ClassView5 cls={CLASS_1} />;
  else if (view === 'class-6') body = <ClassView6 cls={CLASS_1} />;
  else if (view === 'class-7') body = <ClassView7 cls={CLASS_1} />;

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-[rgb(246,246,246)]/85 dark:bg-[#161616]/85 backdrop-blur-md">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:items-center">
          <h1 className="text-2xl font-bold text-black dark:text-gray-100">
            Welcome, {user?.name}
          </h1>
          <div className="flex md:justify-center">
            <ViewSwitcher value={view} onChange={setView} />
          </div>
          <div className="hidden md:block" />
        </div>
      </div>

      <div key={view} className="animate-[slideUp_350ms_ease-out] px-6 pb-10 pt-2">
        {body}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
