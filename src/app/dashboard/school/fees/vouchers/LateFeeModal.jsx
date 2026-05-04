'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-700 mb-1';

export default function LateFeeModal({ isOpen, onClose, voucher }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [lateFee, setLateFee] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLateFee(voucher?.lateFee ?? 0);
      setNotes('');
    }
  }, [isOpen, voucher]);

  const mutation = useMutation({
    mutationFn: () =>
      patchData({
        url: `/fee/voucher/${voucher?._id}/late-fee`,
        payload: { lateFee: Number(lateFee) || 0, notes },
        token,
      }),
    onSuccess: () => {
      toast.success('Late fee updated');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucher?._id] });
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to update late fee'),
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Late Fee"
      subtitle={voucher?.voucherNumber}
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
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-gray-700',
            }}
          />
          <Button
            label="Save"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-10 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
            loading={mutation.isPending}
            handleClick={() => mutation.mutate()}
          />
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Sets (overwrites) the late fee. Voucher total &amp; balance auto-recalculate.
        </p>
        <div>
          <label className={labelCls}>Late Fee Amount</label>
          <input
            type="number"
            min={0}
            value={lateFee}
            onChange={(e) => setLateFee(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="10 days overdue × ₨ 20/day"
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
