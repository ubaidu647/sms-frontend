/**
 * How far a branch-tier collector can go on a consolidated payment. The server
 * applies the tender to the vouchers oldest first (the order the consolidated
 * view returns them in) and refuses the whole request if any slice lands on a
 * voucher the collector can't act on.
 *
 * `payable`: the most that stays clear of such a voucher, 0 if the oldest one is.
 * `blocker`: the first voucher the tender can't reach, or null.
 */
export function consolidatedReach(vouchers = [], canActOn = () => true) {
  let paisa = 0;
  for (const voucher of vouchers) {
    const balance = Math.round(Number(voucher?.balanceAmount || 0) * 100);
    if (balance <= 0) continue;
    if (!canActOn(voucher)) return { payable: paisa / 100, blocker: voucher };
    paisa += balance;
  }
  return { payable: paisa / 100, blocker: null };
}
