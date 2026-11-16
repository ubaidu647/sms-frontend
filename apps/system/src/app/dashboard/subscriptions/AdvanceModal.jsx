'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { fmtMoney } from '../packages/format';
import { useRecordAdvance } from './hooks/useSubscriptions';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

const PRESETS = [10, 20, 25, 50];

// Record money a school paid ahead (an advance or setup amount). It is saved as
// a paid "Advance" invoice and held as the school's credit; the next plan
// invoice — the trial's first bill, or the next renewal — deducts it.
export default function AdvanceModal({ isOpen, onClose, schoolId, schoolName, current }) {
  const record = useRecordAdvance();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNote('');
      setMethod('');
      setTransactionId('');
      setError('');
    }
  }, [isOpen]);

  const price = current?.packageSnapshot?.price ?? 0;
  const days = current?.packageSnapshot?.durationInDays ?? 0;
  // A rough yearly price for the % helpers: a monthly plan × 12, a yearly plan as is.
  const yearly = days >= 360 ? price : days > 0 ? Math.round((price * 365) / days) : 0;
  const credit = current?.carriedCredit ?? 0;

  const submit = () => {
    const n = Number(amount);
    if (!(n > 0)) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) {
      setError('Amount can have at most 2 decimal places.');
      return;
    }
    setError('');
    const payload = { schoolId, amount: n };
    if (note.trim()) payload.note = note.trim();
    if (method || transactionId)
      payload.paymentInfo = {
        method: method || undefined,
        transactionId: transactionId || undefined,
      };
    record.mutate(payload, {
      onSuccess: () => onClose(),
      onError: (err) => setError(err?.message || 'Could not record the advance.'),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Advance Payment"
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
            label="Record"
            handleClick={submit}
            loading={record.isPending}
            type="button"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
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
          Saved as a paid <strong>Advance</strong> invoice the school can see, and kept as credit.
          The next plan invoice deducts it automatically
          {current?.isTrial ? ' — for a trial, the first bill when it converts' : ''}.
          {credit > 0 && <span className="block mt-1">Current credit: {fmtMoney(credit)}.</span>}
        </p>

        <div>
          <label htmlFor="advance-amount" className={labelCls}>
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            id="advance-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
          {yearly > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESETS.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAmount(String(Math.round((yearly * pct) / 100)))}
                  className="px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {pct}% of a year ({fmtMoney(Math.round((yearly * pct) / 100))})
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="advance-note" className={labelCls}>
            Note (shown on the invoice)
          </label>
          <input
            id="advance-note"
            className={inputCls}
            maxLength={200}
            placeholder="Advance — 20% of yearly plan"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Payment method</label>
            <input
              className={inputCls}
              placeholder="e.g. bank"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Transaction ID</label>
            <input
              className={inputCls}
              placeholder="e.g. TX1"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
