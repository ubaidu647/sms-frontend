'use client';
import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { methodToCashOrBank, ACCOUNT_CATEGORY_LABELS } from '@/constants/accounting';

/**
 * Picks which cash or bank head of a branch the money moves through.
 *
 * Cash and bank are not configured in Account Mapping — a school holds cash per
 * branch and can bank with several institutions, so no single school-wide
 * setting could name the right account. They are declared in the Chart of
 * Accounts (category cash/bank) and chosen here, per transaction.
 *
 * The branch usually keeps exactly one account of the relevant kind, in which
 * case this renders as a read-only line: there is nothing to decide, and the
 * server resolves the same account on its own. The picker only appears when
 * there really is a choice to make.
 *
 * `value` is the selected account id ('' when nothing is chosen) and `onChange`
 * receives the id. Callers should send it as `ledgerAccountId` only when the
 * picker reported that a choice was required — see `required` on the change
 * callback's second argument.
 */
export default function CashBankAccountSelect({
  method,
  branchId,
  value,
  onChange,
  disabled = false,
  labelCls = 'block text-xs font-semibold text-gray-700 mb-1',
  inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white',
}) {
  const { accessToken: token } = useTokenStore();
  const mode = methodToCashOrBank(method);

  const { data, isFetching } = useQuery({
    queryKey: ['cash-bank-accounts', mode, branchId || 'own'],
    queryFn: () =>
      fetchData({
        url: '/ledger/cash-bank-accounts',
        token,
        mode,
        branchId: branchId || undefined,
      }),
    enabled: !!token && !!mode,
    staleTime: 60000,
  });

  const accounts = useMemo(() => data?.data || [], [data]);
  const label = ACCOUNT_CATEGORY_LABELS[mode] || mode;

  // With a single account there is nothing to choose — keep the field clear so
  // the server resolves it, which also keeps working if the chart changes.
  const mustChoose = accounts.length > 1;

  useEffect(() => {
    if (!mustChoose && value) onChange('');
    // Drop a stale selection when the method switches cash ↔ bank.
    if (mustChoose && value && !accounts.some((a) => a._id === value)) onChange('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, mustChoose, accounts]);

  if (isFetching && !accounts.length) {
    return (
      <div>
        <label className={labelCls}>{label} Account</label>
        <div className="text-xs text-gray-400 py-2">Loading {label.toLowerCase()} accounts…</div>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div>
        <label className={labelCls}>{label} Account</label>
        <p className="text-xs text-amber-600 dark:text-amber-500 py-2">
          This branch has no {label.toLowerCase()} account. Add one in Chart of Accounts — a level-3
          account under Assets with category “{label}” — otherwise this entry cannot post to the
          ledger.
        </p>
      </div>
    );
  }

  if (!mustChoose) {
    const only = accounts[0];
    return (
      <div>
        <label className={labelCls}>{label} Account</label>
        <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
          {only.code} · {only.name}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className={labelCls}>
        {label} Account<span className="text-red-500">*</span>
      </label>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        <option value="">Select {label.toLowerCase()} account…</option>
        {accounts.map((a) => (
          <option key={a._id} value={a._id}>
            {a.code} · {a.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        This branch has {accounts.length} {label.toLowerCase()} accounts — choose where the amount
        goes.
      </p>
    </div>
  );
}
