'use client';

import { useState } from 'react';
import { ArrowRight, Check, Gift, Lock, Plus } from 'lucide-react';
import {
  ADDON_MODULES,
  CORE_INCLUDED,
  LAUNCH_OFFER,
  PLAN_LIMITS,
  PLANS,
  YEARLY_MULTIPLIER,
  wa,
} from './landingData';

const rs = (n) => `Rs ${n.toLocaleString('en-PK')}`;

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const k = yearly ? YEARLY_MULTIPLIER : 1;
  const per = yearly ? 'year' : 'month';

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex items-center rounded-full bg-white p-1 shadow-sm ring-1 ring-teal-900/10"
        >
          {[
            [false, 'Monthly'],
            [true, 'Yearly'],
          ].map(([value, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={yearly === value}
              onClick={() => setYearly(value)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                yearly === value
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              {label}
              {value && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${
                    yearly ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  2 months free
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3 items-stretch">
        {PLANS.map((p) => {
          const regular = p.price * k;
          const offer = p.offerPrice * k;
          const msg = `Assalam-o-Alaikum, mujhe Mizenzo School ka ${p.name} package (${
            yearly ? 'yearly' : 'monthly'
          }) chahiye.`;
          return (
            <article
              key={p.code}
              className={`relative flex flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                p.featured
                  ? 'bg-gradient-to-b from-teal-600 to-teal-800 text-white shadow-2xl shadow-teal-700/30 lg:scale-[1.03]'
                  : 'bg-white text-slate-900 shadow-lg shadow-teal-900/5 ring-1 ring-teal-900/10'
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-950 shadow">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className={`mt-1 text-sm ${p.featured ? 'text-teal-50/80' : 'text-slate-500'}`}>
                {p.description}
              </p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-extrabold tracking-tight">{rs(offer)}</span>
                <span
                  className={`pb-1 text-sm ${p.featured ? 'text-teal-50/80' : 'text-slate-500'}`}
                >
                  /{per}
                </span>
              </div>
              <p className={`mt-1 text-sm ${p.featured ? 'text-teal-50/80' : 'text-slate-500'}`}>
                <s>{rs(regular)}</s> after the launch offer
              </p>
              <p
                className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  p.featured ? 'bg-white/15 text-white' : 'bg-teal-50 text-teal-700'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Locked for {LAUNCH_OFFER.lockMonths} months · first {LAUNCH_OFFER.maxSchools}{' '}
                schools
              </p>

              <a
                href={wa(msg)}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full py-3 font-semibold transition-all ${
                  p.featured
                    ? 'bg-white text-teal-700 hover:bg-amber-50'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
                }`}
              >
                Get {p.name}
                <ArrowRight className="w-4 h-4" />
              </a>

              <ul className="mt-7 space-y-2.5 text-sm">
                {PLAN_LIMITS.map((l) => {
                  const v = p.limits[l.key];
                  return (
                    <li key={l.key} className="flex items-start gap-2.5">
                      <Check
                        className={`mt-0.5 w-4 h-4 shrink-0 ${p.featured ? 'text-amber-300' : 'text-teal-600'}`}
                      />
                      <span>
                        <b>{v.toLocaleString('en-PK')}</b> {v === 1 && l.one ? l.one : l.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className={`my-6 h-px ${p.featured ? 'bg-white/20' : 'bg-slate-100'}`} />

              <ul className="space-y-2.5 text-sm">
                {ADDON_MODULES.map((m) => {
                  const on = p.modules.includes(m.key);
                  return (
                    <li
                      key={m.key}
                      className={`flex items-start gap-2.5 ${
                        on ? '' : p.featured ? 'text-teal-50/60' : 'text-slate-400'
                      }`}
                    >
                      {on ? (
                        <Check
                          className={`mt-0.5 w-4 h-4 shrink-0 ${p.featured ? 'text-amber-300' : 'text-teal-600'}`}
                        />
                      ) : (
                        <Plus className="mt-0.5 w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {m.label}
                        {!on && (
                          <span className="text-xs">
                            {' '}
                            — add-on {rs(m.price * k)}/{per}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div className="lg:w-64 shrink-0">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-teal-700">
              <Gift className="w-4 h-4" />
              Every plan includes
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Grow past a limit? Add students, staff, sections, branches or storage as add-ons any
              time.
            </p>
          </div>
          <ul className="grid flex-1 gap-x-6 gap-y-2.5 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            {CORE_INCLUDED.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <Check className="mt-0.5 w-4 h-4 shrink-0 text-teal-600" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
