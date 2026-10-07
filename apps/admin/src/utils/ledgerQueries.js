/** Every cached query whose numbers come from posted journal entries. */
export const LEDGER_QUERY_KEYS = [
  'journal-list',
  'journal-detail',
  'account-ledger',
  'account-detail',
  'financial-report',
];

/**
 * After anything that posts or reverses a journal (manual journal, voucher,
 * void, payslip pay / reverse / cancel) ledgers, statements and account
 * balances move, so refetch all of them rather than wait out the staleTime.
 */
export function invalidateLedgerQueries(queryClient) {
  for (const key of LEDGER_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: [key] });
}
