'use client';
import React from 'react';

/** Default and ceiling for a free trial — the API refuses more than 90 days. */
export const DEFAULT_TRIAL_DAYS = 14;
export const MAX_TRIAL_DAYS = 90;

/**
 * Reads the trial toggle + days into the request value: `undefined` when off
 * (a paid plan), else a whole number of days, or an error to show.
 */
export function readTrial({ on, days }) {
  if (!on) return { error: '', value: undefined };
  const n = Number(days === '' || days == null ? DEFAULT_TRIAL_DAYS : days);
  if (!Number.isInteger(n) || n < 1 || n > MAX_TRIAL_DAYS)
    return {
      error: `A trial must be a whole number of days from 1 to ${MAX_TRIAL_DAYS}.`,
      value: undefined,
    };
  return { error: '', value: n };
}

const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300';
const defaultInputCls =
  'w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl disabled:opacity-50';

// "Start with a free trial" + days, shared by Register and Assign. A trial is
// the chosen package in full, with no invoice until it is converted (Renew =
// same package, Change plan = another), which starts the paid plan that day.
export default function TrialField({ on, onToggle, days, onDaysChange, inputClassName }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-3 space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
        <input
          type="checkbox"
          className="h-4 w-4 accent-amber-600"
          checked={on}
          onChange={(e) => onToggle(e.target.checked)}
        />
        Start with a free trial of this package
      </label>
      {on && (
        <>
          <div>
            <label htmlFor="trial-days" className={labelCls}>
              Trial length (days)
            </label>
            <input
              id="trial-days"
              type="number"
              min="1"
              max={MAX_TRIAL_DAYS}
              step="1"
              inputMode="numeric"
              value={days}
              onChange={(e) => onDaysChange(e.target.value)}
              placeholder={String(DEFAULT_TRIAL_DAYS)}
              className={inputClassName || defaultInputCls}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            The school gets the whole package with no invoice. When the trial ends, the plan starts
            on its own with an unpaid first invoice; the payment window below decides how long they
            keep working before it turns read-only. Any advance you record is deducted from that
            bill. You can extend or shorten the trial later.
          </p>
        </>
      )}
    </div>
  );
}
