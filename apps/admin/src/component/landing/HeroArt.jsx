import { ArrowRight, Bell, Clock, MessageCircle } from 'lucide-react';
import LandingIcon from './LandingIcon';

// The classroom photo (from mizenzo.com) is 1084×887; the cards sit over the
// soft blurred patches in it, placed in the photo's own coordinates.
const W = 1084;
const H = 887;
const at = (x, y, w) => ({
  left: `${(x / W) * 100}%`,
  top: `${(y / H) * 100}%`,
  width: `${(w / W) * 100}%`,
});

const ATTENDANCE = [
  { label: 'Present', pct: 92, count: 184, tone: '#00918e' },
  { label: 'Absent', pct: 5, count: 10, tone: '#ef4444' },
  { label: 'Late', pct: 3, count: 6, tone: '#f5b301' },
];

// Each row swaps between two modules.
const MODULE_ROWS = [
  [
    { icon: 'Users', title: 'Parent portal', sub: 'Every child, one login', tone: '#00918e' },
    {
      icon: 'ClipboardList',
      title: 'Online admissions',
      sub: 'Enquiry to admitted',
      tone: '#007a77',
    },
  ],
  [
    { icon: 'Wallet', title: 'Fee collection', sub: 'Vouchers & concessions', tone: '#f5b301' },
    { icon: 'Coins', title: 'Staff payroll', sub: 'Salary & payslips', tone: '#16a34a' },
  ],
  [
    { icon: 'BarChart3', title: 'Exam results', sub: 'Marks & result cards', tone: '#00a8a4' },
    { icon: 'Award', title: 'Certificates', sub: 'Urdu & English', tone: '#d97706' },
  ],
];

function ModuleRow({ m }) {
  return (
    <span className="flex items-center gap-[1.6cqw]">
      <span
        className="grid place-items-center rounded-[1.4cqw] w-[4.6cqw] h-[4.6cqw] shrink-0"
        style={{ color: m.tone, background: `${m.tone}1f` }}
      >
        <LandingIcon name={m.icon} className="w-[2.6cqw] h-[2.6cqw]" />
      </span>
      <span className="flex-1 min-w-0 leading-tight">
        <b className="block font-semibold truncate">{m.title}</b>
        <small className="block text-[1.3cqw] text-slate-500 truncate">{m.sub}</small>
      </span>
      <ArrowRight className="w-[2.2cqw] h-[2.2cqw] text-slate-400 shrink-0" aria-hidden="true" />
    </span>
  );
}

const RING = 2 * Math.PI * 16;

export default function HeroArt() {
  return (
    <div className="lp-art relative w-full" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/school.webp"
        width={W}
        height={H}
        alt=""
        fetchPriority="high"
        className="block w-full h-auto select-none"
      />

      {/* today's attendance, with WhatsApp alerts to parents */}
      <div className="lp-card lp-float" style={at(89, 160, 338)}>
        <div className="flex items-center gap-[1.2cqw] mb-[1.6cqw]">
          <span className="grid place-items-center rounded-[1.2cqw] w-[3.8cqw] h-[3.8cqw] bg-teal-50 text-teal-600">
            <Clock className="w-[2.2cqw] h-[2.2cqw]" />
          </span>
          <b className="font-semibold whitespace-nowrap">Attendance today</b>
          <span className="ml-auto inline-flex items-center gap-[0.6cqw] rounded-full bg-emerald-50 text-emerald-700 px-[1.2cqw] py-[0.4cqw] text-[1.25cqw] font-semibold whitespace-nowrap">
            <MessageCircle className="w-[1.6cqw] h-[1.6cqw]" />
            Alerts on
          </span>
        </div>
        <div className="grid grid-cols-3 gap-[1cqw] text-center">
          {ATTENDANCE.map((a, i) => (
            <div key={a.label}>
              <svg viewBox="0 0 40 40" className="w-[8.5cqw] h-[8.5cqw] mx-auto">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#eef4f4" strokeWidth="3.5" />
                <circle
                  className="lp-ring"
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
                  fill="#0b2b2a"
                >
                  {a.pct}%
                </text>
              </svg>
              <span className="block mt-[0.6cqw] text-[1.35cqw] font-medium">
                {a.label} <small className="text-slate-500">({a.count})</small>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* an announcement */}
      <div className="lp-card lp-float" style={{ ...at(751, 291, 284), animationDelay: '-1.6s' }}>
        <div className="flex items-center gap-[1.2cqw] mb-[0.8cqw]">
          <span className="grid place-items-center rounded-[1.2cqw] w-[3.8cqw] h-[3.8cqw] bg-amber-50 text-amber-500">
            <Bell className="w-[2.2cqw] h-[2.2cqw]" />
          </span>
          <b className="font-semibold whitespace-nowrap">New announcement</b>
        </div>
        <p className="text-slate-600 leading-snug">Term 1 results published for Class 7</p>
      </div>

      {/* modules, each row swapping to a second one */}
      <div
        className="lp-card lp-float space-y-[1.4cqw]"
        style={{ ...at(751, 476, 305), animationDelay: '-3s' }}
      >
        {MODULE_ROWS.map(([a, b], i) => (
          <div key={a.title} className="relative overflow-hidden h-[5cqw]">
            <div className="lp-swap-a absolute inset-0" style={{ animationDelay: `${i * 1.2}s` }}>
              <ModuleRow m={a} />
            </div>
            <div className="lp-swap-b absolute inset-0" style={{ animationDelay: `${i * 1.2}s` }}>
              <ModuleRow m={b} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
