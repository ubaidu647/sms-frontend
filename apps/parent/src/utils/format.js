// Small shared formatters for the dashboard pages.

export function formatDate(
  value,
  opts = { day: "numeric", month: "short", year: "numeric" },
) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, opts);
}

/**
 * The school's money: "Rs 1,250" with `symbol` (useSchoolCurrency().symbol),
 * the bare amount without one.
 */
export function formatMoney(value, symbol) {
  const n = Number(value || 0);
  const amount = n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const sym = typeof symbol === "string" ? symbol.trim() : "";
  return sym ? `${sym} ${amount}` : amount;
}
