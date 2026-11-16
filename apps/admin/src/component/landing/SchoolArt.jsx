import { Dancing_Script } from 'next/font/google';

import Icon from './Icon';

const chalk = Dancing_Script({ subsets: ['latin'], weight: ['600'], display: 'swap' });

/**
 * Hero artwork, ported from the School page on mizenzo.com and recoloured to
 * the school dashboard's teal and gold: a classroom photo with live cards over
 * it — today's attendance with WhatsApp alerts, a results announcement, and a
 * module list that rotates. On the board the motto writes itself word by word.
 *
 * Cards are placed in the photo's own 1084×887 coordinates and sized in
 * container units (styles under "hero photo art" in landing.css). Decorative.
 */

const W = 1084;
const H = 887;

const at = (x, y, w) => ({
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
  width: `${(w / W) * 100}%`,
});

const RING = 2 * Math.PI * 16;

const ATTENDANCE = [
  { label: 'Present', pct: 92, count: 184, tone: '#16a34a' },
  { label: 'Absent', pct: 5, count: 10, tone: '#ef4444' },
  { label: 'Late', pct: 3, count: 6, tone: '#d99a00' },
];

/* each row swaps between two modules */
const MODULES = [
  [
    { icon: 'users', title: 'Parent portal', sub: 'Every child under one login', tone: '#00918e' },
    {
      icon: 'clipboard',
      title: 'Online admissions',
      sub: 'From enquiry to admitted',
      tone: '#006360',
    },
  ],
  [
    {
      icon: 'wallet',
      title: 'Fee vouchers',
      sub: 'Concessions, fines & receipts',
      tone: '#d99a00',
    },
    { icon: 'coins', title: 'Staff payroll', sub: 'Salary structures & payslips', tone: '#16a34a' },
  ],
  [
    {
      icon: 'chart',
      title: 'Exam results',
      sub: 'Marks, result cards & publishing',
      tone: '#00a8a4',
    },
    {
      icon: 'award',
      title: 'Certificates',
      sub: 'SLC & character, Urdu & English',
      tone: '#006360',
    },
  ],
];

/* the chalkboard motto, one word per line, each in a brand colour */
const MOTTO = [
  { word: 'Better', x: 6, y: 156, tone: '#5fe0da' },
  { word: 'Students', x: -4, y: 195, tone: '#ffdc34' },
  { word: 'Brighter', x: 0, y: 234, tone: '#f5b301' },
  { word: 'Future', x: 8, y: 271, tone: '#66cbc7' },
];
const MX = 866; // centre of the motto on the board
const MY = 200;

/* Motto timing, in seconds of one 14s cycle. */
const CYCLE = 14;
const STEP = 1.8;
const CHALK = '#e3eef6';
const RAYS_AT = (MOTTO.length - 1) * STEP + 1.8;
const FADE_AT = 12.2;

const pc = (t) => `${((t / CYCLE) * 100).toFixed(2)}%`;

const MOTTO_CSS =
  MOTTO.map((m, i) => {
    const s = i * STEP;
    const fade = FADE_AT + i * 0.2;
    const colour = `fill:${m.tone};stroke:${m.tone};filter:url(#sa-chalk) drop-shadow(0 0 5px ${m.tone}aa)`;
    const chalky = `fill:${CHALK};stroke:${CHALK};filter:url(#sa-chalk) drop-shadow(0 0 1px #ffffff40)`;
    return `@keyframes sa-word-${i}{
    0%,${pc(s)}{opacity:0;stroke-dashoffset:420;fill-opacity:0;${colour}}
    ${pc(s + 0.05)}{opacity:1;stroke-dashoffset:420;fill-opacity:0;${colour}}
    ${pc(s + 0.8)}{opacity:1;stroke-dashoffset:0;fill-opacity:0;${colour}}
    ${pc(s + 1)},${pc(s + 1.5)}{opacity:1;stroke-dashoffset:0;fill-opacity:1;${colour}}
    ${pc(s + 1.75)},${pc(fade)}{opacity:1;stroke-dashoffset:0;fill-opacity:1;${chalky}}
    ${pc(fade + 0.5)},100%{opacity:0;stroke-dashoffset:0;fill-opacity:1;${chalky}}}
  .sa-word-${i}{animation:sa-word-${i} ${CYCLE}s linear infinite}`;
  }).join('\n') +
  `
  @keyframes sa-ray{
    0%,${pc(RAYS_AT)}{opacity:0;transform:scale(.2)}
    ${pc(RAYS_AT + 0.35)}{opacity:1;transform:scale(1.25)}
    ${pc(RAYS_AT + 0.6)},${pc(FADE_AT + 0.6)}{opacity:.9;transform:scale(1)}
    ${pc(FADE_AT + 1.1)},100%{opacity:0;transform:scale(1)}}`;

/* chalk rays on both sides of the motto, drawn after the last word */
const RAYS = [
  ...[146, 156, 166, 176, 186, 196, 206, 216],
  ...[-36, -26, -16, -6, 4, 14, 24, 34],
].map((deg, i) => {
  const t = (deg * Math.PI) / 180;
  const r1 = 1.0;
  const r2 = 1.1 + ((i * 7) % 5) * 0.025;
  return {
    x1: MX + Math.cos(t) * 92 * r1,
    y1: MY + Math.sin(t) * 78 * r1,
    x2: MX + Math.cos(t) * 92 * r2,
    y2: MY + Math.sin(t) * 78 * r2,
  };
});

function ModRow({ m }) {
  return (
    <>
      <span className="ha-ico" style={{ color: m.tone, background: `${m.tone}1f` }}>
        <Icon name={m.icon} />
      </span>
      <span className="sa-mod-t">
        <b>{m.title}</b>
        <small>{m.sub}</small>
      </span>
      <span className="ha-arrow">
        <Icon name="arrow" />
      </span>
    </>
  );
}

export default function SchoolArt() {
  return (
    <div className="ha-art sa-art" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="ha-img"
        src="/landing/school.webp"
        width={W}
        height={H}
        alt=""
        fetchPriority="high"
      />

      <svg className="ha-fx" viewBox={`0 0 ${W} ${H}`} focusable="false">
        <defs>
          <filter id="sa-chalk" x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".9"
              numOctaves="2"
              seed="3"
              result="grain"
            />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="1" result="rough" />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45"
              result="speck"
            />
            <feComposite in="rough" in2="speck" operator="in" />
          </filter>
        </defs>
        <style>{MOTTO_CSS}</style>
        <g
          className="sa-motto"
          transform={`rotate(-9 ${MX} ${MY})`}
          style={{ fontFamily: chalk.style.fontFamily }}
        >
          {MOTTO.map((m, i) => (
            <text
              key={m.word}
              className={`sa-word sa-word-${i}`}
              x={MX + m.x}
              y={m.y}
              textAnchor="middle"
              fontSize="41"
              fill={CHALK}
              stroke={CHALK}
            >
              {m.word}
            </text>
          ))}
          <g stroke={CHALK} strokeWidth="2" strokeLinecap="round" filter="url(#sa-chalk)">
            {RAYS.map((r, i) => (
              <line
                key={i}
                className="sa-ray"
                x1={r.x1}
                y1={r.y1}
                x2={r.x2}
                y2={r.y2}
                style={{ animationDelay: `${(i % 8) * 0.06}s` }}
              />
            ))}
          </g>
        </g>
        <path
          className="ha-trail"
          d="M930 150C944 140 952 132 962 124"
          fill="none"
          stroke="#e8f1ff"
          strokeOpacity=".8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 6"
        />
        <g className="ha-plane">
          <path
            d="M966 118 1006 100 990 134 984 122Z"
            fill="none"
            stroke="#f2f7ff"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M984 122 1006 100"
            fill="none"
            stroke="#f2f7ff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <g fill="#ffdc34">
          <path className="ha-twinkle" d="M560 30l5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" />
          <path
            className="ha-twinkle"
            style={{ animationDelay: '-1.4s' }}
            d="M60 420l4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"
          />
        </g>
      </svg>

      {/* today's attendance, with the WhatsApp alert that goes to parents */}
      <div className="ha-card sa-att" style={at(89, 160, 338)}>
        <div className="sa-head">
          <span className="ha-ico sa-head-ico">
            <Icon name="clock" />
          </span>
          <b>Attendance today</b>
          <span className="sa-wa">
            <Icon name="wa" />
            Alerts on
          </span>
        </div>
        <div className="sa-rings">
          {ATTENDANCE.map((a, i) => (
            <div key={a.label}>
              <svg viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#e6f1f0" strokeWidth="3.5" />
                <circle
                  className="sa-ring"
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={a.tone}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                  strokeDasharray={`${(a.pct / 100) * RING} ${RING}`}
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
                <text
                  x="20"
                  y="23.5"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="700"
                  fill="#0b2524"
                >
                  {a.pct}%
                </text>
              </svg>
              <span>
                {a.label}
                <small>({a.count})</small>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* an announcement */}
      <div className="ha-card sa-notice" style={at(751, 291, 284)}>
        <div className="sa-head">
          <span className="ha-ico sa-bell">
            <Icon name="bell" />
          </span>
          <b>New announcement</b>
        </div>
        <p>Term 1 results published for Class 7</p>
        <span className="ha-arrow">
          <Icon name="arrow" />
        </span>
      </div>

      {/* modules, each row swapping to a second one */}
      <div className="ha-card sa-mods" style={at(751, 476, 305)}>
        {MODULES.map(([a, b], i) => (
          <div className="sa-mod" key={a.title}>
            <div className="sa-mod-a" style={{ animationDelay: `${i * 1.2}s` }}>
              <ModRow m={a} />
            </div>
            <div className="sa-mod-b" style={{ animationDelay: `${i * 1.2}s` }}>
              <ModRow m={b} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
