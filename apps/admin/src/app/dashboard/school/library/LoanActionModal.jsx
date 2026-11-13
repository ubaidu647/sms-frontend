'use client';
// Return / Renew / Mark lost / Waive fine / Fine paid for one loan.
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CashBankAccountSelect from '@/component/CashBankAccountSelect';
import { patchData } from '@/utils/api';
import { localYMD } from '@/utils/localDate';
import { branchIdOf } from '@/utils/permissions';
import { useTokenStore } from '@/store/tokenStore';
import {
  COPY_CONDITIONS,
  diffDaysYMD,
  loanAccession,
  loanBookTitle,
  loanBorrowerName,
  overdueDays,
  previewFine,
} from '@/utils/library';
import ConfirmModal from './ConfirmModal';
import {
  errorCls,
  fmtDate,
  inputCls,
  invalidateLibraryCirculation,
  labelCls,
  money,
  useLibrarySettings,
} from './libraryShared';
import { useSchoolCurrency } from '@/hooks/useSchoolCurrency';

const MODES = {
  return: { title: 'Return book', confirmLabel: 'Return', tone: 'primary', done: 'Book returned' },
  renew: { title: 'Renew loan', confirmLabel: 'Renew', tone: 'primary', done: 'Loan renewed' },
  lost: { title: 'Mark book lost', confirmLabel: 'Mark lost', tone: 'danger', done: 'Marked lost' },
  waive: { title: 'Waive fine', confirmLabel: 'Waive', tone: 'warning', done: 'Fine waived' },
  'fine-paid': {
    title: 'Fine paid',
    confirmLabel: 'Mark paid',
    tone: 'primary',
    done: 'Fine marked paid',
  },
};

/** Extracts the updated loan from a mutation response (`data` or `data.loan`). */
export const loanOfResponse = (res) => res?.data?.loan || res?.data || null;

export default function LoanActionModal({ mode, loan, onClose, onDone }) {
  const { symbol: currencySymbol } = useSchoolCurrency();
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const cfg = MODES[mode] || MODES.return;
  const today = localYMD();
  const [returnedAt, setReturnedAt] = useState(today);
  const [condition, setCondition] = useState('');
  const [charge, setCharge] = useState('');
  const [reason, setReason] = useState('');
  const [ledgerAccountId, setLedgerAccountId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setReturnedAt(localYMD());
    setCondition('');
    setCharge('');
    setReason('');
    setLedgerAccountId('');
    setError('');
  }, [mode, loan?._id]);

  const { settings } = useLibrarySettings(branchIdOf(loan?.branchId), {
    enabled: !!loan && (mode === 'return' || mode === 'lost'),
  });
  const fine = useMemo(
    () =>
      previewFine({
        dueDate: loan?.dueDate,
        returnedAt: mode === 'lost' ? today : returnedAt,
        settings,
      }),
    [loan?.dueDate, returnedAt, settings, mode, today],
  );

  const mutation = useMutation({
    mutationFn: (payload) =>
      patchData({ url: `/library/loans/${loan._id}/${mode}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || cfg.done);
      invalidateLibraryCirculation(queryClient);
      onDone?.(res, mode);
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Action failed');
      toast.error(err.message || 'Action failed');
    },
  });

  const submit = () => {
    setError('');
    if (mode === 'return') {
      if (!returnedAt) return setError('Pick the return date');
      if (returnedAt > today) return setError('Return date cannot be in the future');
      if (diffDaysYMD(loan.issuedAt, returnedAt) < 0) {
        return setError('Return date cannot be before the issue date');
      }
      return mutation.mutate({ returnedAt, ...(condition ? { condition } : {}) });
    }
    if (mode === 'lost') {
      const n = Number(charge);
      if (charge === '' || !Number.isFinite(n) || n < 0) {
        return setError('Enter the replacement charge (0 or more)');
      }
      return mutation.mutate({ charge: n });
    }
    if (mode === 'waive') {
      if (!reason.trim()) return setError('A reason is required to waive a fine');
      return mutation.mutate({ reason: reason.trim() });
    }
    return mutation.mutate(ledgerAccountId ? { ledgerAccountId } : {});
  };

  if (!loan) return null;
  const od = loan.status === 'issued' ? overdueDays(loan.dueDate) : 0;

  return (
    <ConfirmModal
      isOpen={!!loan}
      onClose={onClose}
      title={cfg.title}
      confirmLabel={cfg.confirmLabel}
      cancelLabel="Close"
      confirmTone={cfg.tone}
      loading={mutation.isPending}
      onConfirm={submit}
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
          <div>
            <strong>{loanBookTitle(loan)}</strong> · {loanAccession(loan)}
          </div>
          <div>
            {loanBorrowerName(loan)} <span className="capitalize">({loan.borrowerType})</span>
          </div>
          <div>
            Issued {fmtDate(loan.issuedAt)} · Due {fmtDate(loan.dueDate)}
            {od > 0 && (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {' '}
                · {od} day(s) overdue
              </span>
            )}
          </div>
        </div>

        {mode === 'return' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Return date</label>
                <input
                  type="date"
                  value={returnedAt}
                  max={today}
                  onChange={(e) => setReturnedAt(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={`${inputCls} capitalize`}
                >
                  <option value="">Unchanged</option>
                  {COPY_CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <FinePreview fine={fine} settings={settings} />
          </>
        )}

        {mode === 'renew' && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The due date moves forward by the borrower&apos;s loan days. Renewals used:{' '}
            {Number(loan.renewals) || 0} of 2.
          </p>
        )}

        {mode === 'lost' && (
          <>
            <div>
              <label className={labelCls}>Replacement charge ({currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                className={inputCls}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The copy is marked lost. The fine = this charge
              {fine.amount > 0 ? ` + the late fine so far (≈ ${money(fine.amount)})` : ''}.
              {loan.borrowerType === 'student' && ' It is added to the next fee voucher.'}
            </p>
          </>
        )}

        {(mode === 'waive' || mode === 'fine-paid') && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Fine: <strong>{money(loan.fine?.amount)}</strong>
            {loan.fine?.days ? ` (${loan.fine.days} day(s) late)` : ''}
          </p>
        )}

        {mode === 'waive' && (
          <div>
            <label className={labelCls}>Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={300}
              className={inputCls}
            />
          </div>
        )}
        {mode === 'fine-paid' && (
          <>
            <CashBankAccountSelect
              method="cash"
              branchId={branchIdOf(loan.branchId) || undefined}
              value={ledgerAccountId}
              onChange={setLedgerAccountId}
              labelCls={labelCls}
              inputCls={inputCls}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Records that the staff member paid this fine in cash.
            </p>
          </>
        )}

        {error && <p className={errorCls}>{error}</p>}
      </div>
    </ConfirmModal>
  );
}

export function FinePreview({ fine, settings }) {
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm ${
        fine.amount > 0
          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
          : 'bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300'
      }`}
    >
      {fine.amount > 0 ? (
        <>
          Estimated fine: <strong>{money(fine.amount)}</strong> ({fine.days} day(s) ×{' '}
          {money(settings.finePerDay)}
          {Number(settings.graceDays) > 0 ? `, after ${settings.graceDays} grace day(s)` : ''}
          {Number(settings.maxFinePerLoan) > 0
            ? `, capped at ${money(settings.maxFinePerLoan)}`
            : ''}
          )
        </>
      ) : (
        'No late fine.'
      )}
    </div>
  );
}
