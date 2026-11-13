// Upload storage of the school: `storage: { usedBytes, limitGB }` from
// GET /subscription/me/current (limitGB includes add-ons; null = unlimited),
// and the API's refusal when an upload would go over it.
// GB is 1024³ bytes, as the backend counts it (sms-backend src/shared/storage.ts).

export const BYTES_PER_GB = 1024 ** 3;
const BYTES_PER_MB = 1024 ** 2;

// Share of the limit at which the card turns to a warning colour.
export const STORAGE_WARN_AT = 0.9;

/** `code` of the 403 an upload gets when it would exceed the storage limit. */
export const STORAGE_LIMIT_REACHED = 'STORAGE_LIMIT_REACHED';

export const STORAGE_FULL_FALLBACK = 'Storage full. Delete old files or ask for more storage.';

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
 * → { usedText, limitText (null when unlimited), unlimited, percent, warn, full }
 */
export const storageUsage = (storage) => {
  if (!storage || typeof storage !== 'object') return null;
  const used = Math.max(0, Number(storage.usedBytes) || 0);
  const limitGB = storage.limitGB == null ? null : Number(storage.limitGB);
  const usedText = formatBytes(used);
  if (limitGB == null || !Number.isFinite(limitGB)) {
    return { usedText, limitText: null, unlimited: true, percent: 0, warn: false, full: false };
  }
  const limitBytes = limitGB * BYTES_PER_GB;
  const raw = limitBytes > 0 ? used / limitBytes : used > 0 ? 1 : 0;
  return {
    usedText,
    limitText: formatGB(limitGB),
    unlimited: false,
    percent: Math.round(Math.min(1, raw) * 100),
    warn: raw >= STORAGE_WARN_AT,
    full: raw >= 1,
  };
};

const codeOf = (err) => err?.code ?? err?.response?.data?.code;

/** True when an API error (axios, or utils/api.js's) is the storage-full refusal. */
export const isStorageFull = (err) => codeOf(err) === STORAGE_LIMIT_REACHED;

/**
 * The server's storage-full message ("Storage full: 1.9 GB of 2 GB used. …"),
 * or null when `err` is not that refusal.
 */
export const storageFullMessage = (err) => {
  if (!isStorageFull(err)) return null;
  const msg = err?.response?.data?.message ?? err?.message;
  return typeof msg === 'string' && msg.trim() ? msg.trim() : STORAGE_FULL_FALLBACK;
};
