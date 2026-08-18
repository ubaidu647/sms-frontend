'use client';
import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

/**
 * How the money came in — picked straight from the Chart of Accounts rather
 * than a fixed list of method names.
 *
 * The options are the branch's own cash/bank heads plus the school-wide ones
 * (appliesToAllBranches); heads belonging to another branch never appear. That
 * is the same set the server accepts, so a valid choice here can never be
 * rejected on submit.
 *
 * `onChange` receives the whole account. Callers derive from `category`:
 *   cash → method 'cash', no reference needed
 *   bank → method 'bank-transfer', reference number required (cheque no,
 *          transaction id, …) since a bank line has to be traceable.
 */
export default function PaymentAccountSelect({
  branchId,
  value,
  onChange,
  disabled = false,
  labelCls = 'block text-xs font-semibold text-gray-700 mb-1',
  inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white',
}) {
  const { accessToken: token } = useTokenStore();

  // No `mode` param → the endpoint returns cash and bank heads together.
  const { data, isFetching } = useQuery({
    queryKey: ['payment-accounts', branchId || 'own'],
    queryFn: () =>
      fetchData({
        url: '/ledger/cash-bank-accounts',
        token,
        branchId: branchId || undefined,
      }),
    enabled: !!token,
    staleTime: 60000,
  });

  const accounts = useMemo(() => data?.data || [], [data]);
  const cash = useMemo(() => accounts.filter((a) => a.category === 'cash'), [accounts]);
  const bank = useMemo(() => accounts.filter((a) => a.category === 'bank'), [accounts]);

  // One account means there is nothing to decide — select it so the collector
  // isn't asked a question with a single answer.
  useEffect(() => {
    if (!accounts.length) return;
    if (!value) {
      if (accounts.length === 1) onChange(accounts[0]);
      return;
    }
    // Drop a selection that no longer exists (branch switched, chart edited).
    if (!accounts.some((a) => a._id === value)) onChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, value]);

  if (isFetching && !accounts.length) {
    return (
      <div>
        <label className={labelCls}>Received In</label>
        <div className="text-xs text-gray-400 py-2">Loading accounts…</div>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div>
        <label className={labelCls}>Received In</label>
        <p className="text-xs text-amber-600 dark:text-amber-500 py-2">
          This branch has no cash or bank account. Add one in Chart of Accounts — a level-3 account
          under Assets with category “Cash” or “Bank” — before recording payments.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className={labelCls}>
        Received In<span className="text-red-500">*</span>
      </label>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(accounts.find((a) => a._id === e.target.value) || null)}
        className={inputCls}
      >
        <option value="">Select account…</option>
        {cash.length > 0 && (
          <optgroup label="Cash">
            {cash.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} · {a.name}
              </option>
            ))}
          </optgroup>
        )}
        {bank.length > 0 && (
          <optgroup label="Bank">
            {bank.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} · {a.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
