// Money display helpers. Percent components (e.g. 7.5% of 33,333) produce
// long binary fractions; round to paise before showing them so the UI never
// prints "2499.9750000000004" or 3 fraction digits.

/** `n` rounded to 2 decimals (non-numbers → 0). */
export function round2(n) {
  const num = Number(n) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/** `pct`% of `base`, rounded to 2 decimals. */
export function percentOf(base, pct) {
  return round2(((Number(base) || 0) * (Number(pct) || 0)) / 100);
}

/** Localised amount with at most 2 fraction digits (no currency symbol). */
export function formatAmount(n) {
  return round2(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}
