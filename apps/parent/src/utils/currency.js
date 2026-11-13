// The school's own currency, from GET /schools/settings (`currency`,
// `currencySymbol`). A label only: the school's amounts are never converted.

/** What applies while the settings load, on error, or when none is set. */
export const DEFAULT_SCHOOL_CURRENCY = Object.freeze({ code: "PKR", symbol: "Rs" });

const SYMBOLS = {
  PKR: "Rs",
  INR: "₹",
  BDT: "৳",
  AFN: "؋",
  AED: "AED",
  SAR: "SAR",
  QAR: "QAR",
  OMR: "OMR",
  KWD: "KWD",
  BHD: "BHD",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

/**
 * { code, symbol } from a settings payload. The server's symbol wins; a code
 * without one takes the known symbol (else the code itself); no code → PKR / Rs.
 */
export function currencyFromSettings(settings) {
  const code =
    typeof settings?.currency === "string" ? settings.currency.trim().toUpperCase() : "";
  if (!code) return { ...DEFAULT_SCHOOL_CURRENCY };
  const own =
    typeof settings?.currencySymbol === "string" ? settings.currencySymbol.trim() : "";
  return { code, symbol: own || SYMBOLS[code] || code };
}
