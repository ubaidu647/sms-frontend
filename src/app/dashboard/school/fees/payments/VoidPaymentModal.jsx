'use client';
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatMoney } from '@/constants/fee';

export default function VoidPaymentModal({ isOpen, onClose, payment }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: () =>
      patchData({
        url: `/fee/payment/${payment?._id}/void`,
        payload: { reason },
        token,
      }),
    onSuccess: () => {
      toast.success('Payment voided');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher'] });
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to void payment'),
  });

  const submit = () => {
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    mutation.mutate();
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Payment"
      confirmLabel="Void Payment"
      confirmTone="danger"
      loading={mutation.isPending}
      onConfirm={submit}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          Voiding receipt <strong>{payment?.receiptNumber}</strong> ({formatMoney(payment?.amount)})
          will reverse it from the voucher&apos;s paid amount and recompute its status.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for voiding (e.g. cheque bounced)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 bg-white"
        />
      </div>
    </ConfirmModal>
  );
}
