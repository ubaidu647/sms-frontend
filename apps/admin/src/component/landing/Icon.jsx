// Line icons for the landing page — the same set the mizenzo.com site uses,
// plus a few school-specific ones. Decorative: hidden from assistive tech.

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const PATHS = {
  phone: (
    <path
      {...S}
      d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"
    />
  ),
  school: (
    <g {...S}>
      <path d="m22 9-10-5L2 9l10 5 10-5Z" />
      <path d="M6 11.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" />
      <path d="M22 9v6" />
    </g>
  ),
  bus: (
    <g {...S}>
      <rect x="4" y="3" width="16" height="15" rx="3" />
      <path d="M4 11h16M8 3v8M16 3v8" />
      <path d="M6 18v2.5M18 18v2.5" />
      <circle cx="8" cy="14.5" r=".8" fill="currentColor" />
      <circle cx="16" cy="14.5" r=".8" fill="currentColor" />
    </g>
  ),
  wa: (
    <path
      fill="currentColor"
      d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1s-.7 1-.9 1.2c-.2.2-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.3 4.7a18 18 0 0 0 1.8.7c.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4l-.5-.3ZM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Z"
    />
  ),
  facebook: (
    <path
      fill="currentColor"
      d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"
    />
  ),
  check: <polyline {...S} strokeWidth={2.4} points="20 6 9 17 4 12" />,
  plus: (
    <g {...S} strokeWidth={2.2}>
      <path d="M12 5v14M5 12h14" />
    </g>
  ),
  arrow: (
    <g {...S} strokeWidth={2.2}>
      <line x1="4" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </g>
  ),
  mail: (
    <g {...S}>
      <rect x="2" y="4" width="20" height="16" rx="2.5" />
      <path d="m2.5 6.5 9.5 6 9.5-6" />
    </g>
  ),
  pin: (
    <g {...S}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </g>
  ),
  shield: (
    <g {...S}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <polyline points="9 12 11 14 15 10" />
    </g>
  ),
  wallet: (
    <g {...S}>
      <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M16 13h3" />
    </g>
  ),
  users: (
    <g {...S}>
      <path d="M16 20v-1.8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
      <circle cx="9" cy="7" r="3.5" />
      <path d="M22 20v-1.8a4 4 0 0 0-3-3.9M16.5 3.7a4 4 0 0 1 0 7" />
    </g>
  ),
  chart: (
    <g {...S}>
      <line x1="3" y1="21" x2="21" y2="21" />
      <rect x="5" y="11" width="3.6" height="7" rx="1" />
      <rect x="10.2" y="6" width="3.6" height="12" rx="1" />
      <rect x="15.4" y="13" width="3.6" height="5" rx="1" />
    </g>
  ),
  lock: (
    <g {...S}>
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </g>
  ),
  zap: <polygon {...S} points="13 2 4 14 11 14 10 22 20 10 13 10 13 2" />,
  box: (
    <g {...S}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </g>
  ),
  clock: (
    <g {...S}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </g>
  ),
  book: (
    <g {...S}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20v6H6.5A2.5 2.5 0 0 1 4 19.5Z" />
    </g>
  ),
  coins: (
    <g {...S}>
      <ellipse cx="9" cy="6" rx="6.5" ry="2.8" />
      <path d="M2.5 6v4.5c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8V6" />
      <path d="M2.5 10.5V15c0 1.5 2.9 2.8 6.5 2.8 1 0 2-.1 2.8-.3" />
      <ellipse cx="17" cy="16" rx="4.8" ry="2.2" />
      <path d="M12.2 16v3.4c0 1.2 2.1 2.2 4.8 2.2s4.8-1 4.8-2.2V16" />
    </g>
  ),
  award: (
    <g {...S}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 13.9 7 22l5-3 5 3-1.5-8.1" />
    </g>
  ),
  clipboard: (
    <g {...S}>
      <rect x="5" y="4" width="14" height="18" rx="2" />
      <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M9 11h6M9 15h6M9 19h3" />
    </g>
  ),
  calendar: (
    <g {...S}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <polyline points="9 15.5 11 17.5 15 13.5" />
    </g>
  ),
  trending: (
    <g {...S}>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="15 7 21 7 21 13" />
    </g>
  ),
  bank: (
    <g {...S}>
      <path d="M3 10 12 4l9 6" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />
    </g>
  ),
  layout: (
    <g {...S}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 9h18M9 21V9" />
    </g>
  ),
  smartphone: (
    <g {...S}>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </g>
  ),
  bell: (
    <g {...S}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </g>
  ),
};

export default function Icon({ name, className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
