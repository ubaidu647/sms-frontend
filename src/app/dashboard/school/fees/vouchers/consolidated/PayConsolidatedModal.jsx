'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_COLORS,
  REFERENCE_REQUIRED_METHODS,
  formatMoney,
  formatMonth,
  todayYMD,
} from '@/constants/fee';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function PayConsolidatedModal({
  isOpen,
  onClose,
  studentId,
  outstandingTotal = 0,
  studentLabel,
}) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(todayYMD());
  const [method, setMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(outstandingTotal || 0);
      setPaymentDate(todayYMD());
      setMethod('cash');
      setReferenceNumber('');
      setNotes('');
      setSubmitError('');
      setResult(null);
    }
  }, [isOpen, outstandingTotal]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      postData({ url: '/fee/payment/consolidated', payload, token }),
    onSuccess: (res) => {
      const payload = res?.data;
      toast.success(
        `Recorded ${formatMoney(payload?.totalApplied)} across ${
          payload?.payments?.length || 0
        } voucher(s)`,
      );
      queryClient.invalidateQueries({ queryKey: ['consolidated', studentId] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['outstandingReport'] });
      setResult(payload);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to record consolidated payment';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const refRequired = REFERENCE_REQUIRED_METHODS.includes(method);

  const submit = () => {
    setSubmitError('');
    const num = Number(amount);
    if (!num || num <= 0) return setSubmitError('Amount must be > 0');
    if (num > outstandingTotal)
      return setSubmitError(
        `Amount cannot exceed outstanding ${formatMoney(outstandingTotal)}`,
      );
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate))
      return setSubmitError('Payment date must be YYYY-MM-DD');
    if (!PAYMENT_METHODS.includes(method))
      return setSubmitError('Invalid payment method');
    if (refRequired && !referenceNumber.trim())
      return setSubmitError('Reference number is required for this method');

    const payload = {
      studentId,
      amount: num,
      paymentDate,
      method,
    };
    if (referenceNumber.trim()) payload.referenceNumber = referenceNumber.trim();
    if (notes.trim()) payload.notes = notes.trim();
    mutation.mutate(payload);
  };

  if (!studentId) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={result ? 'Payment Applied' : 'Pay Arrears'}
      subtitle={studentLabel || 'Consolidated payment'}
      size="lg"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label={result ? 'Close' : 'Cancel'}
            handleClick={onClose}
            type="button"
            styleObject={{
              baseColor: 'bg-white border border-gray-300',
              hoverColor: 'hover:bg-gray-50',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          {!result && (
            <Button
              label="Confirm Payment"
              styleObject={{
                baseColor: 'bg-teal-600',
                hoverColor: 'hover:bg-teal-700',
                rounded: 'rounded-full',
                size: 'px-10 py-3 text-md min-h-[3rem]',
                textColor: 'text-white',
              }}
              loading={mutation.isPending}
              handleClick={submit}
            />
          )}
          {result && (
            <Button
              label="Print"
              styleObject={{
                baseColor: 'bg-teal-600',
                hoverColor: 'hover:bg-teal-700',
                rounded: 'rounded-full',
                size: 'px-10 py-3 text-md min-h-[3rem]',
                textColor: 'text-white',
              }}
              handleClick={() => window.print()}
            />
          )}
        </div>
      }
    >
      {!result ? (
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {submitError}
            </div>
          )}

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Outstanding Total
              </span>
              <span className="text-xl font-bold text-red-700">
                {formatMoney(outstandingTotal)}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Payment is applied FIFO — earliest month first, then forward.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Amount<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={outstandingTotal}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Date<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Method<span className="text-red-500">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className={inputCls}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Reference / Cheque #
                {refRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={refRequired ? 'Required' : 'Optional'}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className={inputCls}
            />
          </div>
        </div>
      ) : (
        <ResultView result={result} />
      )}
    </Modal>
  );
}

function ResultView({ result }) {
  const payments = result?.payments || [];
  const affected = result?.affectedVouchers || [];
  // pair receipts with their voucher row by index (API returns them in matching order)
  const rows = affected.map((v, i) => ({
    voucher: v,
    payment: payments[i],
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 rounded-lg">
          <div className="text-xs uppercase tracking-wide text-green-700 dark:text-green-400">
            Applied
          </div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-300 mt-1">
            {formatMoney(result?.totalApplied)}
          </div>
        </div>
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg">
          <div className="text-xs uppercase tracking-wide text-red-700 dark:text-red-400">
            Remaining Outstanding
          </div>
          <div className="text-2xl font-bold text-red-800 dark:text-red-300 mt-1">
            {formatMoney(result?.remainingOutstanding)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Receipt #</th>
              <th className="px-3 py-2 text-left">Month</th>
              <th className="px-3 py-2 text-left">Voucher</th>
              <th className="px-3 py-2 text-right">Applied</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ voucher, payment }, i) => (
              <tr
                key={voucher._id || i}
                className="border-t border-gray-100 dark:border-gray-800"
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {payment?.receiptNumber || '—'}
                </td>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                  {formatMonth(voucher.month)}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                  {voucher.voucherNumber}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatMoney(voucher.applied)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    voucher.balanceAmount > 0 ? 'text-red-700' : 'text-gray-500'
                  }`}
                >
                  {formatMoney(voucher.balanceAmount)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      voucher.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {voucher.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments[0]?.method && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          Method:
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
              PAYMENT_METHOD_COLORS[payments[0].method] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {payments[0].method}
          </span>
        </div>
      )}
    </div>
  );
}
