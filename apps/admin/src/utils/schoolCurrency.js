// The school's own currency (GET /schools/settings → `currency`,
// `currencySymbol`). It is a label only: changing it converts no stored amount.
// Platform billing (what the platform charges the school) never follows it —
// see PLATFORM_CURRENCY_SYMBOL in app/dashboard/billing/format.js.

/** The currencies the API accepts, as { code, symbol, name }. */
export const SCHOOL_CURRENCIES = [
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

/** What applies while the settings load, on error, and for unknown codes. */
export const DEFAULT_SCHOOL_CURRENCY = Object.freeze({ code: 'PKR', symbol: 'Rs' });

const byCode = (code) =>
  SCHOOL_CURRENCIES.find(
    (c) =>
      c.code ===
      String(code || '')
        .trim()
        .toUpperCase(),
  ) || null;

/** True when `code` is one of SCHOOL_CURRENCIES. */
export function isSchoolCurrency(code) {
  return !!byCode(code);
}

/**
 * The symbol for an ISO code ("PKR" → "Rs"). An unknown code shows as itself
 * (a payslip stored in a code we do not list still reads sensibly); none at
 * all → the default symbol.
 */
export function currencySymbolOf(code) {
  if (!code) return DEFAULT_SCHOOL_CURRENCY.symbol;
  return byCode(code)?.symbol || String(code);
}

/**
 * { code, symbol } from a settings payload. The server's symbol wins; a code
 * without one takes the list's symbol; anything missing → the default.
 */
export function currencyFromSettings(settings) {
  const code = typeof settings?.currency === 'string' ? settings.currency.trim().toUpperCase() : '';
  if (!code) return { ...DEFAULT_SCHOOL_CURRENCY };
  const symbol =
    typeof settings?.currencySymbol === 'string' && settings.currencySymbol.trim()
      ? settings.currencySymbol.trim()
      : currencySymbolOf(code);
  return { code, symbol };
}

// The school's currency in force, for formatters that run outside a component
// (formatMoney in constants/*). useSchoolSettings sets it before the dashboard
// renders, useSchoolCurrency keeps it in step, and the Currency settings page
// sets it on save.
let current = { ...DEFAULT_SCHOOL_CURRENCY };

/** Record the school's currency ({ code, symbol }); falsy → the default. */
export function setSchoolCurrency(next) {
  current =
    next && next.code
      ? { code: next.code, symbol: next.symbol || currencySymbolOf(next.code) }
      : { ...DEFAULT_SCHOOL_CURRENCY };
}

/** The school's currency in force: { code, symbol }. */
export function schoolCurrency() {
  return current;
}

/** The school's currency symbol in force (e.g. "Rs"). */
export function schoolCurrencySymbol() {
  return current.symbol;
}
