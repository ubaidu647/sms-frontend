'use client';

import { useState } from 'react';

import Icon from './Icon';
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

/** Plan cards in the mizenzo.com pricing style, with the launch offer and add-on prices. */
export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const k = yearly ? YEARLY_MULTIPLIER : 1;
  const per = yearly ? 'year' : 'month';

  return (
    <>
      <div className="price-toggle" role="group" aria-label="Billing period">
        <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
          Monthly
        </button>
        <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
          Yearly <span className="save">2 months free</span>
        </button>
      </div>

      <div className="price-grid">
        {PLANS.map((p, i) => {
          const msg = `Assalam-o-Alaikum, mujhe Mizenzo School ka ${p.name} package (${
            yearly ? 'yearly' : 'monthly'
          }) chahiye.`;
          return (
            <article
              key={p.code}
              className={'price-card rv' + (p.featured ? ' featured' : '')}
              data-delay={i * 80}
            >
              {p.featured && <span className="price-badge">Most popular</span>}
              <h3>{p.name}</h3>
              <p className="price-desc">{p.description}</p>
              <div className="price-amount">
                <b>{rs(p.offerPrice * k)}</b>
                <span>/{per}</span>
              </div>
              <p className="price-was">
                <s>{rs(p.price * k)}</s> after the launch offer
              </p>
              <p className="price-sub">
                <Icon name="lock" /> Locked {LAUNCH_OFFER.lockMonths} months · first{' '}
                {LAUNCH_OFFER.maxSchools} schools
              </p>
              <a
                href={wa(msg)}
                target="_blank"
                rel="noopener noreferrer"
                className={'btn ' + (p.featured ? 'btn-primary' : 'btn-ghost')}
              >
                Get {p.name} <Icon name="arrow" />
              </a>
              <ul className="price-list">
                {PLAN_LIMITS.map((l) => {
                  const v = p.limits[l.key];
                  return (
                    <li key={l.key}>
                      <Icon name="check" />
                      <span>
                        <b>{v.toLocaleString('en-PK')}</b> {v === 1 && l.one ? l.one : l.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <ul className="price-list">
                {ADDON_MODULES.map((m) => {
                  const on = p.modules.includes(m.key);
                  return (
                    <li key={m.key} className={on ? undefined : 'off'}>
                      {on ? <Icon name="check" /> : <Icon name="plus" className="x" />}
                      <span>
                        {m.label}
                        {!on && (
                          <span className="price-note">
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

      <div className="price-core rv">
        <div>
          <span className="eyebrow">Every plan includes</span>
          <p>
            Grow past a limit? Add students, staff, sections, branches or storage as add-ons any
            time.
          </p>
        </div>
        <ul>
          {CORE_INCLUDED.map((c) => (
            <li key={c}>
              <Icon name="check" />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
