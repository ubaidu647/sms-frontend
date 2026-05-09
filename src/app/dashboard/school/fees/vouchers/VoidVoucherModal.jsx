'use client';
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

export default function VoidVoucherModal({ isOpen, onClose, voucher }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: () =>
      patchData({
        url: `/fee/voucher/${voucher?._id}/void`,
        payload: { reason },
        token,
      }),
    onSuccess: () => {
      toast.success('Voucher voided');
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucher', voucher?._id] });
      onClose();
    },
    onError: (err) => toast.error(err.message || 'Failed to void voucher'),
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
      title="Void Voucher"
      confirmLabel="Void Voucher"
      confirmTone="danger"
      loading={mutation.isPending}
      onConfirm={submit}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Voiding {voucher?.voucherNumber} cannot be reversed. Vouchers with payments must have
          payments voided first.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for voiding (required)"
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
        />
      </div>
    </ConfirmModal>
  );
}
