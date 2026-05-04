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
  REFERENCE_REQUIRED_METHODS,
  formatMoney,
  todayYMD,
} from '@/constants/fee';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function RecordPaymentModal({ isOpen, onClose, voucher }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(todayYMD());
  const [method, setMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(voucher?.balanceAmount ?? 0);
      setPaymentDate(todayYMD());
      setMethod('cash');
      setReferenceNumber('');
      setNotes('');
      setSubmitError('');
      setReceipt(null);
    }
  }, [isOpen, voucher]);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/fee/payment', payload, token }),
    onSuccess: (res) => {
      toast.success(`Receipt ${res?.data?.payment?.receiptNumber} saved`);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucher?._id] });
      setReceipt(res?.data);
    },
    onError: (err) => {
      const msg = err.message || 'Failed to record payment';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const refRequired = REFERENCE_REQUIRED_METHODS.includes(method);

  const submit = () => {
    setSubmitError('');
    const num = Number(amount);
    if (!num || num <= 0) return setSubmitError('Amount must be > 0');
    if (num > (voucher?.balanceAmount ?? 0))
      return setSubmitError(`Amount exceeds balance ${formatMoney(voucher?.balanceAmount)}`);
    if (refRequired && !referenceNumber.trim())
      return setSubmitError('Reference number is required for this method');

    const payload = {
      voucherId: voucher._id,
      amount: num,
      paymentDate,
      method,
    };
    if (referenceNumber.trim()) payload.referenceNumber = referenceNumber.trim();
    if (notes.trim()) payload.notes = notes.trim();
    mutation.mutate(payload);
  };

  if (!voucher) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={receipt ? 'Payment Receipt' : 'Record Payment'}
      subtitle={voucher.voucherNumber}
      size="md"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label={receipt ? 'Close' : 'Cancel'}
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
          {!receipt && (
            <Button
              label="Record Payment"
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
          {receipt && (
            <Button
              label="Print Receipt"
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
      {!receipt ? (
        <div className="space-y-4">
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg text-sm">
            <Stat label="Total" value={formatMoney(voucher.totalAmount)} />
            <Stat label="Paid" value={formatMoney(voucher.paidAmount)} tone="text-green-700" />
            <Stat label="Balance" value={formatMoney(voucher.balanceAmount)} tone="text-red-700" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Amount<span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={voucher.balanceAmount}
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
        <div className="space-y-4">
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-xs text-green-700 uppercase tracking-widest">Receipt</div>
            <div className="text-3xl font-bold text-green-800 mt-1">
              {receipt.payment.receiptNumber}
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-3">
              {formatMoney(receipt.payment.amount)}
            </div>
            <div className="text-sm text-gray-600 mt-1 capitalize">{receipt.payment.method}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <Stat
              label="Voucher Total"
              value={formatMoney(receipt.voucher.totalAmount)}
            />
            <Stat
              label="Paid"
              value={formatMoney(receipt.voucher.paidAmount)}
              tone="text-green-700"
            />
            <Stat
              label="Balance"
              value={formatMoney(receipt.voucher.balanceAmount)}
              tone={receipt.voucher.balanceAmount > 0 ? 'text-red-700' : 'text-gray-700'}
            />
          </div>
          <div className="text-center text-xs text-gray-500 capitalize">
            Voucher status: <strong>{receipt.voucher.status}</strong>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value, tone = 'text-gray-900' }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`text-base font-medium ${tone}`}>{value}</div>
    </div>
  );
}
