'use client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatMoney } from '@/constants/accounting';
import {
  inputCls,
  labelCls,
  cancelButtonStyle,
  primaryButtonStyle,
  invalidateFinanceQueries,
} from './financeShared';

export default function VoidEntryModal({ isOpen, onClose, entry }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      patchData({ url: `/finance/entries/${entry._id}/void`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Entry voided');
      invalidateFinanceQueries(queryClient);
      onClose();
    },
    onError: (err) => {
      const msg = err.message || 'Could not void the entry';
      setError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('A reason is required');
      return;
    }
    mutation.mutate({ reason: reason.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !mutation.isPending && onClose()}
      title="Void entry"
      subtitle={entry ? `${entry.serialNumber} — ${formatMoney(entry.amount)}` : ''}
      size="sm"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label="Cancel"
            handleClick={onClose}
            type="button"
            styleObject={cancelButtonStyle}
          />
          <Button
            label="Void"
            handleClick={handleSubmit}
            loading={mutation.isPending}
            type="button"
            styleObject={primaryButtonStyle('bg-red-600', 'hover:bg-red-700')}
          />
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The entry stays in the list marked as void, and its amount is taken back out of the books
          and the Profit &amp; Loss.
        </p>
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className={labelCls}>
            Reason<span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Entered twice"
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
