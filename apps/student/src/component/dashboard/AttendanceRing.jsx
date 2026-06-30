'use client';

// SVG progress ring for the attendance presentPercentage. Use the backend's
// presentPercentage straight for the value.
export default function AttendanceRing({ percentage = 0, size = 140, stroke = 12 }) {
  const pct = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 75 ? '#00918e' : pct >= 50 ? '#f5b21c' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pct}%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">present</span>
      </div>
    </div>
  );
}
