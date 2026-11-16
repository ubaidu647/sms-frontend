'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { fmtDate } from '../packages/format';
import { useSetTrialEnd } from './hooks/useSubscriptions';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

/** Total trial length the API allows, extensions included. */
const MAX_TRIAL_TOTAL_DAYS = 180;
const DAY = 24 * 60 * 60 * 1000;

const ymdLocal = (d) => {
  const x = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};

// Extend or shorten a running free trial. It ends at the end of the chosen day;
// then the plan starts on its own with an unpaid first invoice.
export default function TrialEndModal({ isOpen, onClose, schoolId, schoolName, current }) {
  const setEnd = useSetTrialEnd();
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEndDate(current?.endDate ? ymdLocal(current.endDate) : '');
      setError('');
    }
  }, [isOpen, current]);

  const today = ymdLocal(Date.now());
  const latest = current?.startDate
    ? ymdLocal(new Date(current.startDate).getTime() + MAX_TRIAL_TOTAL_DAYS * DAY)
    : undefined;

  const submit = () => {
    if (!endDate) {
      setError('Choose the last day of the trial.');
      return;
    }
    if (endDate < today) {
      setError('The trial cannot end before today.');
      return;
    }
    setError('');
    setEnd.mutate(
      { schoolId, endDate },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(err?.message || 'Could not change the trial.'),
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Trial End"
      subtitle={schoolName ? `For ${schoolName}` : undefined}
      size="md"
      footer={
        <div className="flex gap-3 w-full justify-end">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label="Save"
            handleClick={submit}
            loading={setEnd.isPending}
            type="button"
            styleObject={{
              baseColor: 'bg-amber-600',
              hoverColor: 'hover:bg-amber-700',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Trial started {fmtDate(current?.startDate)} and now ends {fmtDate(current?.endDate)}. Pick
          a later day to extend it, or an earlier one to shorten it.
        </p>
        <div>
          <label htmlFor="trial-end" className={labelCls}>
            Last day of the trial
          </label>
          <input
            id="trial-end"
            type="date"
            className={inputCls}
            min={today}
            max={latest}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            A trial can run at most {MAX_TRIAL_TOTAL_DAYS} days in total. When it ends, the plan
            starts automatically and its first invoice is issued.
          </p>
        </div>
      </div>
    </Modal>
  );
}
