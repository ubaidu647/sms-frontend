import Link from 'next/link';

// Shared look for every sign-in page (admin, student, parent, system) — the
// same deep-teal band, gold accent and logo lockup as the school.mizenzo.com
// landing page. Colours are written as hex so the page looks identical in
// every app, whatever that app's Tailwind palette is. Keep the four copies
// (apps/*/src/app/(auth)/AuthShell.jsx) in step.

const HEADING = 'font-[family-name:var(--font-heading)]';

// The landing page's logo lockup: logo, "Mizenzo" in teal, "SCHOOL MANAGEMENT"
// in gold. On the dark band it sits in a white pill so the colours stay the same.
function Brand({ onDark = false }) {
  return (
    <span
      className={`flex items-center gap-3 ${
        onDark ? 'rounded-2xl bg-white pl-2.5 pr-5 py-2 shadow-lg shadow-black/25' : ''
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Mizenzo"
        width={44}
        height={44}
        className="w-11 h-11 object-contain shrink-0"
      />
      <span className="leading-none">
        <span className={`block text-xl font-bold tracking-tight text-[#00918e] ${HEADING}`}>
          Mizenzo
        </span>
        <span className="block mt-1 text-[10.5px] font-bold uppercase tracking-[0.24em] text-[#d99a00]">
          School Management
        </span>
      </span>
    </span>
  );
}

function BrandLink({ href, onDark, className = '' }) {
  if (!href) {
    return (
      <div className={`w-fit ${className}`}>
        <Brand onDark={onDark} />
      </div>
    );
  }
  return (
    <Link href={href} className={`w-fit ${className}`} aria-label="Mizenzo School home">
      <Brand onDark={onDark} />
    </Link>
  );
}

/**
 * @param portal    small badge text, e.g. "Staff portal"
 * @param title     first heading line (white)
 * @param highlight second heading line (teal → gold gradient)
 * @param lead      paragraph under the heading
 * @param features  [{ icon: LucideIcon, title, sub? }] — 2 or 3 tiles
 * @param heading   form heading, e.g. "Staff sign in"
 * @param sub       line under the form heading
 * @param aside     optional node under `sub` (e.g. a link to another portal)
 * @param homeHref  where the logo links to (omit for no link)
 */
export default function AuthShell({
  portal,
  title,
  highlight,
  lead,
  features = [],
  heading,
  sub,
  aside,
  homeHref,
  children,
}) {
  return (
    <div className="min-h-screen flex bg-[#f6f9f9] dark:bg-[#0a0a0a]">
      {/* ─── Left brand band ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-b from-[#05302e] via-[#03211f] to-[#021514] text-white p-12 flex-col justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_520px_at_85%_8%,rgba(0,145,142,0.5),transparent_70%),radial-gradient(620px_440px_at_0%_100%,rgba(245,179,1,0.16),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1.6px)] [background-size:26px_26px] [mask-image:radial-gradient(80%_90%_at_55%_40%,#000_20%,transparent_100%)]"
        />

        <BrandLink href={homeHref} onDark className="relative" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-[#f5b301]/35 text-xs font-bold uppercase tracking-[0.14em] text-[#ffdc34]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffdc34]" />
            {portal}
          </div>
          <h2
            className={`mt-6 text-4xl xl:text-5xl font-semibold leading-[1.12] tracking-tight ${HEADING}`}
          >
            {title}
            <span className="block">
              <span className="inline-block pb-1 bg-gradient-to-r from-[#5fe0da] via-[#33b9b5] to-[#ffdc34] bg-clip-text text-transparent">
                {highlight}
              </span>
            </span>
          </h2>
          <p className="mt-5 text-white/75 max-w-md leading-relaxed">{lead}</p>

          <div
            className={`mt-10 grid gap-4 max-w-lg ${
              features.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
            }`}
          >
            {features.map(({ icon: Icon, title: t, sub: s }) => (
              <div
                key={t}
                className="rounded-2xl bg-white/[0.06] border border-white/[0.12] p-4 backdrop-blur"
              >
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#f5b301]/15 text-[#ffdc34]">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div className="mt-3 text-sm font-semibold">{t}</div>
                {s && <div className="mt-0.5 text-xs text-white/60">{s}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 text-xs text-white/55">
          <span>© {new Date().getFullYear()} Mizenzo Solutions. All rights reserved.</span>
          <a href="https://mizenzo.com" className="hover:text-[#ffdc34] transition-colors">
            mizenzo.com
          </a>
        </div>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="relative flex-1 flex items-center justify-center p-5 sm:p-10 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(520px_380px_at_100%_0%,rgba(0,168,164,0.12),transparent_70%),radial-gradient(420px_320px_at_0%_100%,rgba(255,220,52,0.10),transparent_70%)] dark:opacity-40"
        />
        <div className="relative w-full max-w-md">
          <BrandLink href={homeHref} className="lg:hidden mb-8 mx-auto" />

          <div className="rounded-3xl bg-white dark:bg-[#161616] border border-[#00918e]/10 dark:border-white/10 shadow-xl shadow-[#004c4a]/[0.06] p-6 sm:p-9">
            <h1
              className={`text-[28px] font-semibold tracking-tight text-[#0b1f1e] dark:text-gray-100 ${HEADING}`}
            >
              {heading}
            </h1>
            {sub && <p className="mt-2 text-sm text-[#405554] dark:text-gray-400">{sub}</p>}
            {aside}
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
