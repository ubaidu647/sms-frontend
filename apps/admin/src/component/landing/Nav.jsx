'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import Icon from './Icon';
import { CONTACT, NAV_DROP, PORTALS, WA_DEMO } from './landingData';

/**
 * The mizenzo.com navbar: transparent over the hero, then a floating
 * frosted pill once the page scrolls. Logo | centred links | actions.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className={'nav' + (scrolled ? ' scrolled' : '')}>
        <div className="wrap">
          <Link href="/" className="logo" aria-label="Mizenzo School home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo-mark" src="/logo.png" alt="" width={512} height={512} />
            <span className="logo-text">
              <b>Mizenzo</b>
              <small>School</small>
            </span>
          </Link>

          <nav aria-label="Main">
            <ul className="nav-links">
              <li className="has-drop">
                <a href="#features">Features</a>
                <div className="drop">
                  {NAV_DROP.map((d) => (
                    <a key={d.title} href={d.href}>
                      <span className="di" style={{ background: `${d.tone}1f`, color: d.tone }}>
                        <Icon name={d.icon} />
                      </span>
                      <span>
                        <b>{d.title}</b>
                        <small>{d.sub}</small>
                      </span>
                    </a>
                  ))}
                </div>
              </li>
              <li>
                <a href="#new">What&apos;s new</a>
              </li>
              <li>
                <a href="#portals">Portals</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            <Link href="/signin" className="nav-login">
              School login
            </Link>
            <a
              href={WA_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-demo btn-sm"
            >
              Request a demo
            </a>
            <button
              type="button"
              className={'burger' + (menuOpen ? ' open' : '')}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className={'mobile-menu' + (menuOpen ? ' open' : '')} onClick={() => setMenuOpen(false)}>
        <p className="mm-label">Explore</p>
        <a href="#features">Features</a>
        <a href="#new">What&apos;s new</a>
        <a href="#portals">Portals</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <p className="mm-label">Sign in</p>
        {PORTALS.filter((p) => p.href).map((p) =>
          p.href.startsWith('/') ? (
            <Link key={p.key} href={p.href}>
              {p.title}
            </Link>
          ) : (
            <a key={p.key} href={p.href}>
              {p.title}
            </a>
          ),
        )}
        <a href={WA_DEMO} target="_blank" rel="noopener noreferrer" className="btn btn-demo">
          <Icon name="wa" /> Request a demo · {CONTACT.phoneDisplay}
        </a>
      </div>
    </>
  );
}
