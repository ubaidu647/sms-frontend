// Upload storage of a school: `storage: { usedBytes, limitGB }` from the
// current-subscription read. limitGB includes add-ons; null = unlimited.
// GB here is 1024³ bytes, as the backend counts it (src/shared/storage.ts).

export const BYTES_PER_GB = 1024 ** 3;
const BYTES_PER_MB = 1024 ** 2;

// Share of the limit at which the bar turns to a warning.
export const STORAGE_WARN_AT = 0.9;

/** "1.25 GB" / "350 MB" (the backend's format); "-" for a non-number. */
export const formatBytes = (bytes) => {
  const n = Number(bytes);
  if (!Number.isFinite(n)) return '-';
  if (n >= BYTES_PER_GB) return `${(n / BYTES_PER_GB).toFixed(2).replace(/\.?0+$/, '')} GB`;
  return `${Math.max(0, Math.round(n / BYTES_PER_MB))} MB`;
};

/** "2 GB" / "0.5 GB" */
export const formatGB = (gb) =>
  `${Number(gb)
    .toFixed(2)
    .replace(/\.?0+$/, '')} GB`;

/**
 * Display state of a storage reading, or null when there is none.
 * → { usedText, limitText, unlimited, ratio (0–1, capped), percent, warn, full }
 */
export const storageUsage = (storage) => {
  if (!storage || typeof storage !== 'object') return null;
  const used = Math.max(0, Number(storage.usedBytes) || 0);
  const limitGB = storage.limitGB == null ? null : Number(storage.limitGB);
  const usedText = formatBytes(used);
  if (limitGB == null || !Number.isFinite(limitGB)) {
    return {
      usedText,
      limitText: 'Unlimited',
      unlimited: true,
      ratio: 0,
      percent: 0,
      warn: false,
      full: false,
    };
  }
  const limitBytes = limitGB * BYTES_PER_GB;
  const raw = limitBytes > 0 ? used / limitBytes : used > 0 ? 1 : 0;
  const ratio = Math.min(1, raw);
  return {
    usedText,
    limitText: formatGB(limitGB),
    unlimited: false,
    ratio,
    percent: Math.round(ratio * 100),
    warn: raw >= STORAGE_WARN_AT,
    full: raw >= 1,
  };
};
