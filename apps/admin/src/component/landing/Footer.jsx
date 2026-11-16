import Link from 'next/link';

import Icon from './Icon';
import { CONTACT, PORTALS, wa } from './landingData';

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-about">
            <Link href="/" className="logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="logo-mark" src="/logo.png" alt="" width={512} height={512} />
              <span className="logo-text">
                <b>Mizenzo</b>
                <small>School</small>
              </span>
            </Link>
            <p>
              School management for Pakistan — admissions, attendance, fees, exams, payroll and
              parent communication in one system. A product of Mizenzo Solutions.
            </p>
            <div className="foot-contact">
              <a href={`mailto:${CONTACT.email}`}>
                <Icon name="mail" />
                {CONTACT.email}
              </a>
              <a href={`tel:${CONTACT.phoneE164}`}>
                <Icon name="phone" />
                {CONTACT.phoneDisplay}
              </a>
              <span>
                <Icon name="pin" />
                Pakistan · nationwide, remote setup
              </span>
            </div>
          </div>

          <div>
            <h5>Explore</h5>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#new">What&apos;s new</a>
              </li>
              <li>
                <a href="#modules">All modules</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </div>

          <div>
            <h5>Sign in</h5>
            <ul>
              {PORTALS.filter((p) => p.href).map((p) => (
                <li key={p.key}>
                  {p.href.startsWith('/') ? (
                    <Link href={p.href}>{p.title}</Link>
                  ) : (
                    <a href={p.href}>{p.title}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5>Get started</h5>
            <ul>
              <li>
                <a
                  href={wa('Assalam-o-Alaikum, mujhe Mizenzo School ka free demo chahiye.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book a free demo
                </a>
              </li>
              <li>
                <a
                  href={wa('Assalam-o-Alaikum, mujhe Mizenzo School ki pricing chahiye.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask for pricing
                </a>
              </li>
              <li>
                <a
                  href={wa('Assalam-o-Alaikum, hamara data Excel mein hai, import ho sakta hai?')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Import our data
                </a>
              </li>
            </ul>
          </div>

          <div className="foot-social">
            <h5>Mizenzo</h5>
            <ul>
              <li>
                <a href={CONTACT.website}>
                  <Icon name="school" />
                  mizenzo.com
                </a>
              </li>
              <li>
                <a
                  href={wa('Assalam-o-Alaikum Mizenzo, mujhe maloomat chahiye.')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="wa" />
                  WhatsApp · {CONTACT.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="foot-bot">
          <span>© {new Date().getFullYear()} Mizenzo Solutions. All rights reserved.</span>
          <span>Built in Pakistan · PKR-first · Urdu &amp; English support</span>
        </div>
      </div>
    </footer>
  );
}
