'use client';
import React from 'react';
import { PAYMENT_DUE_MAX, PAYMENT_DUE_MIN } from '@/utils/paymentDue';

const defaultInputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all disabled:opacity-50';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300';

// "Payment due (days)" + "Block when unpaid", shared by Register / Assign /
// Change / Renew. Read the values with readPaymentDue (utils/paymentDue).
// `hint` adds a context line (e.g. "leave empty to keep…") under the helper text.
export default function PaymentDueField({
  block,
  onBlockChange,
  days,
  onDaysChange,
  hint,
  inputClassName = defaultInputCls,
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <label htmlFor="payment-due-days" className={labelCls}>
          Payment due (days)
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal-600"
            checked={block}
            onChange={(e) => onBlockChange(e.target.checked)}
          />
          Block when unpaid
        </label>
      </div>
      <input
        id="payment-due-days"
        type="number"
        min={PAYMENT_DUE_MIN}
        max={PAYMENT_DUE_MAX}
        step="1"
        inputMode="numeric"
        className={inputClassName}
        value={block ? days : ''}
        disabled={!block}
        onChange={(e) => onDaysChange(e.target.value)}
        placeholder={block ? 'e.g. 15' : 'Off'}
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {block
          ? `If the invoice isn’t paid within these days of the billed period starting, the school becomes read-only until it is marked paid (${PAYMENT_DUE_MIN}–${PAYMENT_DUE_MAX}).`
          : 'Off: the school is never blocked for an unpaid invoice.'}
        {block && hint ? ` ${hint}` : ''}
      </p>
    </div>
  );
}
