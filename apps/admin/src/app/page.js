import Link from 'next/link';
import { Inter, Sora } from 'next/font/google';

import '@/component/landing/landing.css';
import AuthRedirect from '@/component/landing/AuthRedirect';
import Faq from '@/component/landing/Faq';
import Footer from '@/component/landing/Footer';
import Icon from '@/component/landing/Icon';
import Nav from '@/component/landing/Nav';
import Pricing from '@/component/landing/Pricing';
import Reveal from '@/component/landing/Reveal';
import SchoolArt from '@/component/landing/SchoolArt';
import {
  BgFx,
  Checklist,
  Cta,
  FeatureCard,
  PanelCard,
  SectionHead,
  StatBand,
} from '@/component/landing/Sections';
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
  WA_ENQUIRE,
  WHATS_NEW,
} from '@/component/landing/landingData';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const heading = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata = {
  title: 'Mizenzo School — School Management System in Pakistan',
  description:
    'Admissions, attendance, timetable, exams, fees, payroll, transport, library, certificates and WhatsApp alerts — with school, student and parent portals and an Android app. Plans from Rs 1,500 a month.',
};

const lowestOffer = Math.min(...PLANS.map((p) => p.offerPrice));

function PortalCard({ p, delay }) {
  const body = (
    <>
      <span className="pc-ico">
        <Icon name={p.icon} />
      </span>
      <h3>{p.title}</h3>
      <p>{p.who}</p>
      <span className="pc-go">
        {p.href ? 'Sign in' : 'Ask us for the app'} <Icon name="arrow" />
      </span>
    </>
  );
  if (!p.href) {
    return (
      <a
        href={WA_DEMO}
        target="_blank"
        rel="noopener noreferrer"
        className="pcard rv"
        data-delay={delay}
      >
        {body}
      </a>
    );
  }
  return p.href.startsWith('/') ? (
    <Link href={p.href} className="pcard rv" data-delay={delay}>
      {body}
    </Link>
  ) : (
    <a href={p.href} className="pcard rv" data-delay={delay}>
      {body}
    </a>
  );
}

export default function LandingPage() {
  return (
    <div className={`mz ${inter.variable} ${heading.variable}`}>
      {/* Without JS nothing observes .rv, so show it outright. */}
      <noscript>
        <style>{'.mz .rv{opacity:1 !important;transform:none !important}'}</style>
      </noscript>
      <AuthRedirect />
      <Nav />

      <main>
        {/* ---------------- hero ---------------- */}
        <section className="phero phero-art phero-school">
          <SchoolArt />
          <div className="wrap">
            <div className="crumb">
              <a href={CONTACT.website}>Mizenzo</a> /{' '}
              <a href={`${CONTACT.website}/products`}>Products</a> / <span>Mizenzo School</span>
            </div>
            <a href="#pricing" className="ptag">
              <span className="pi">
                <Icon name="school" />
              </span>
              School Management
              <span className="ptag-offer">
                Launch offer · from Rs {lowestOffer.toLocaleString('en-PK')}/mo
              </span>
            </a>
            <h1>
              Mizenzo School <span className="hl">for a Smarter Tomorrow</span>
            </h1>
            <p className="lead">
              Students, staff, attendance, fees, exams and more, all in one easy-to-use system, with
              portals for parents and students and an Android app for everyone.
            </p>
            <ul className="phero-icons">
              {HERO_ICONS.map((h) => (
                <li key={h.label}>
                  <span>
                    <Icon name={h.icon} />
                  </span>
                  {h.label}
                </li>
              ))}
            </ul>
            <div className="btn-row">
              <a href="#features" className="btn btn-primary btn-lg">
                Explore the platform <Icon name="arrow" />
              </a>
              <a
                href={WA_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-demo btn-lg"
              >
                <Icon name="wa" /> Request a demo
              </a>
              <Link href="/signin" className="btn btn-ghost btn-lg">
                School login <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- stats ---------------- */}
        <section className="section-tight">
          <div className="wrap">
            <StatBand stats={STATS} />
          </div>
        </section>

        {/* ---------------- what's new ---------------- */}
        <section className="section alt" id="new">
          <div className="wrap">
            <SectionHead
              center
              eyebrow="Just added"
              title="New in Mizenzo School"
              sub="The modules schools asked for most — built, tested and running today."
            />
            <div className="fgrid">
              {WHATS_NEW.map((f, i) => (
                <FeatureCard key={f.title} {...f} badge="New" delay={i * 55} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- features ---------------- */}
        <section className="section" id="features">
          <div className="wrap">
            <SectionHead
              center
              eyebrow="What it does"
              title="Everything a school office does before lunch."
              sub="One system, one database, real transactions across modules — so a fee posting and a ledger entry can never half-happen."
            />
            <div className="fgrid">
              {FEATURES.map((f, i) => (
                <FeatureCard key={f.title} {...f} delay={i * 55} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- deep-dive splits ---------------- */}
        {SPLITS.map((sp, i) => (
          <section className={'section' + (i % 2 === 0 ? ' alt' : '')} key={sp.title}>
            <div className="wrap">
              <div className={'split' + (sp.reversed ? ' rev' : '')}>
                <div className="s-txt rv">
                  <span className="eyebrow">{sp.eyebrow}</span>
                  <h2>{sp.title}</h2>
                  <p>{sp.body}</p>
                  <Checklist checks={sp.checks} />
                </div>
                <div className="rv" data-delay={120}>
                  <PanelCard panel={sp.panel} />
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* ---------------- portals ---------------- */}
        <section className="section portals" id="portals">
          <BgFx variant="product" />
          <div className="wrap">
            <SectionHead
              center
              light
              eyebrow="One school, four doors"
              title="A portal for everyone in the school."
              sub="Staff, students and parents each sign in to their own space — all running on the same live data."
            />
            <div className="pgrid">
              {PORTALS.map((p, i) => (
                <PortalCard key={p.key} p={p} delay={i * 70} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- modules ---------------- */}
        <section className="section alt" id="modules">
          <div className="wrap">
            <SectionHead
              center
              eyebrow="Inside the system"
              title="All of it, built and running."
              sub="Not a roadmap — every module below works today, for every branch of your school."
            />
            <div className="mods">
              {MODULES.map((m, i) => (
                <div className="mod rv" data-delay={i * 60} key={m.title}>
                  <h4>
                    <span className="num">{i + 1}</span>
                    {m.title}
                  </h4>
                  <ul>
                    {m.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- pricing ---------------- */}
        <section className="section" id="pricing">
          <div className="wrap">
            <SectionHead
              center
              eyebrow="Pricing"
              title="Simple monthly plans. No per-student surprises."
              sub={`Launch offer for the first ${LAUNCH_OFFER.maxSchools} schools — the offer price stays locked for a full year. Pay yearly and get two months free.`}
            />
            <Pricing />
          </div>
        </section>

        {/* ---------------- faq ---------------- */}
        <section className="section alt" id="faq">
          <div className="wrap">
            <SectionHead center eyebrow="FAQ" title="Mizenzo School — common questions" />
            <Faq items={FAQS} />
          </div>
        </section>

        <Cta
          heading="Poora school, ek system mein."
          body="Tell us how many students and campuses you run, and we will walk you through the school portal, the parent portal and the Android app on your own screen."
          message="Assalam-o-Alaikum, mujhe Mizenzo School ka demo chahiye."
        />
      </main>

      <Footer />

      <a
        href={WA_ENQUIRE}
        target="_blank"
        rel="noopener noreferrer"
        className="wa-float"
        aria-label="Chat on WhatsApp"
      >
        <Icon name="wa" />
        <span className="wt">
          Request a demo
          <small>{CONTACT.phoneDisplay}</small>
        </span>
      </a>

      <Reveal />
    </div>
  );
}
