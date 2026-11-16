import Link from 'next/link';

import Icon from './Icon';
import { CONTACT, wa } from './landingData';

/** Dark band background: base gradient, one soft glow, dot pattern, grain, horizon. */
export function BgFx({ variant = 'cta' }) {
  return (
    <div className={`bgfx bgfx-${variant}`} aria-hidden="true">
      <div className="bgfx-base" />
      <div className="bgfx-glow" />
      <div className="bgfx-dots" />
      <div className="bgfx-noise" />
      <div className="bgfx-horizon" />
    </div>
  );
}

export function SectionHead({ eyebrow, title, sub, center = false, light = false }) {
  return (
    <div className={'section-head rv' + (center ? ' center' : '') + (light ? ' light' : '')}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

export function StatBand({ stats }) {
  return (
    <div className="statband">
      {stats.map((s, i) => (
        <div className="sb rv" data-delay={i * 80} key={s.label}>
          <b>{s.value}</b>
          <i aria-hidden="true" />
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function FeatureCard({ icon, title, body, badge, delay = 0 }) {
  return (
    <div className="fcard rv" data-delay={delay}>
      {badge && <span className="fbadge">{badge}</span>}
      <div className="fi">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export function Checklist({ checks }) {
  return (
    <ul className="checklist">
      {checks.map(([bold, rest]) => (
        <li key={bold}>
          <Icon name="check" />
          <span>
            <b>{bold}</b>
            {rest}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PanelCard({ panel }) {
  return (
    <div className="panel">
      <div className="panel-bar">
        <i />
        <i />
        <i />
        <span>{panel.title}</span>
      </div>
      <div className="panel-body">
        {panel.rows.map((r) => (
          <div className="row-item" key={r.title}>
            <span className="av">{r.av}</span>
            <span className="t">
              <b>{r.title}</b>
              <small>{r.sub}</small>
            </span>
            <span className={'amt' + (r.tone ? ` chip chip-${r.tone}` : '')}>{r.amt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Cta({ heading, body, message }) {
  return (
    <section className="cta">
      <BgFx variant="cta" />
      <div className="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cta-logo rv" src="/logo.png" alt="" width={512} height={512} />
        <h2 className="rv">{heading}</h2>
        <p className="rv" data-delay={80}>
          {body}
        </p>
        <div className="btn-row rv" data-delay={140}>
          <a
            href={wa(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-demo btn-lg"
          >
            <Icon name="wa" /> Request a demo
          </a>
          <Link href="/signin" className="btn btn-light btn-lg">
            School login <Icon name="arrow" />
          </Link>
        </div>
        <div className="cta-num rv" data-delay={200}>
          <Icon name="wa" />
          <span>
            <b>{CONTACT.phoneDisplay}</b>
            <small>Call or WhatsApp · 7 days a week</small>
          </span>
        </div>
      </div>
    </section>
  );
}
