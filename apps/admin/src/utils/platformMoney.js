// Money the platform charges a school (plan prices, invoices, add-ons). It is
// always in the platform's own currency and never follows a school's currency
// setting (that is the school's own money: fees, salaries, …). Change the
// symbol here to move every billing screen at once.
export const PLATFORM_CURRENCY_SYMBOL = 'Rs';

/** "Rs 1,250.5" (at most 2 fraction digits); "-" for a non-number. */
export const fmtPlatformMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  const amount = n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${PLATFORM_CURRENCY_SYMBOL} ${amount}`;
};
