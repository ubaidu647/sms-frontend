import { invalidateLedgerQueries } from './ledgerQueries.js';

/** Every cached query that shows a fee balance, payment or voucher. */
export const FEE_QUERY_KEYS = [
  'payment',
  'payments',
  'voucher',
  'vouchers',
  'consolidated',
  'report-outstanding',
  'report-collection',
  'defaulters',
];

/**
 * After any fee write (payment, void, late fee, generate, regenerate) balances
 * move everywhere, so refetch all of them rather than wait out the staleTime.
 * Those writes post (or reverse) journals too, so the ledgers, journals and
 * financial reports are refetched with them.
 */
export function invalidateFeeQueries(queryClient) {
  for (const key of FEE_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
  invalidateLedgerQueries(queryClient);
}
