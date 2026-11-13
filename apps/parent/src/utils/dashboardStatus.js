// What the dashboard may say about a family's fees. A failed or unfinished
// request says nothing about the balance, so it must never read as "All cleared".
export function amountDueStatus({ isError, outstanding }) {
  if (isError) return { known: false, label: "Could not load", tone: "muted" };
  if (outstanding === undefined || outstanding === null) {
    return { known: false, label: "", tone: "muted" };
  }
  return outstanding > 0
    ? { known: true, label: "Outstanding balance", tone: "due" }
    : { known: true, label: "All cleared", tone: "clear" };
}
