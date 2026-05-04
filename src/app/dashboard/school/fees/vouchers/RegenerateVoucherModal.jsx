'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function RegenerateVoucherModal({ isOpen, onClose, voucher }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setDueDate('');
      setSubmitError('');
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { reason: reason.trim() };
      if (dueDate) payload.dueDate = dueDate;
      return postData({
        url: `/fee/voucher/${voucher?._id}/regenerate`,
        payload,
        token,
      });
    },
    onSuccess: (res) => {
      const newId = res?.data?.newVoucher?._id;
      toast.success('Voucher regenerated');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucher?._id] });
      if (newId) queryClient.invalidateQueries({ queryKey: ['voucher', newId] });
      onClose();
    },
    onError: (err) => {
      const msg = err.message || 'Failed to regenerate voucher';
      setSubmitError(msg);
      toast.error(msg);
    },
  });

  const submit = () => {
    setSubmitError('');
    if (!reason.trim()) {
      setSubmitError('Reason is required');
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Regenerate Voucher"
      subtitle="Voids the current voucher and builds a fresh one from current student / structure / transport state"
      size="md"
      footer={
        <div className="flex gap-3 w-full">
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
            label="Regenerate"
            handleClick={submit}
            loading={mutation.isPending}
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
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {submitError}
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          Voucher{voucher?.voucherNumber ? ` ${voucher.voucherNumber}` : ''} will be voided and
          replaced. Refuses if any payments have been recorded — refund payments first.
        </div>

        <div>
          <label className={labelCls}>
            Reason<span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Student switched routes"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Due Date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
          <p className="text-xs text-gray-400 mt-1">Defaults to original voucher&apos;s due date.</p>
        </div>
      </div>
    </Modal>
  );
}
