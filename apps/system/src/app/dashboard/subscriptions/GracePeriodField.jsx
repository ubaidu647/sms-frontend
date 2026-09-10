'use client';
import React from 'react';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

// Optional grace-period input shared by the Assign / Change / Renew forms.
// `hint` adds a context line (e.g. carry-over note) under the helper text.
export default function GracePeriodField({ value, onChange, hint }) {
  return (
    <div>
      <label className={labelCls}>Grace period (days after expiry)</label>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Days the school keeps access after the subscription expires before writes are blocked. 0 =
        cut off immediately at expiry.
        {hint ? ` ${hint}` : ''}
      </p>
    </div>
  );
}
