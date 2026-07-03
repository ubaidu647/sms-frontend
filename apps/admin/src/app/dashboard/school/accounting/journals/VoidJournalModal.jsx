'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';

export default function VoidJournalModal({ isOpen, onClose, journal }) {
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
      patchData({ url: `/ledger/journal/${journal._id}/void`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Journal entry reversed');
      queryClient.invalidateQueries({ queryKey: ['journal-list'] });
      queryClient.invalidateQueries({ queryKey: ['journal-detail', journal._id] });
      onClose();
    },
    onError: (err) => {
      const msg = err.message || 'Failed to void entry';
      setError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('A reason is required to void this entry');
      return;
    }
    mutation.mutate({ reason: reason.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Void Journal Entry"
      subtitle={journal ? `${journal.serialNumber} — ${journal.narration || ''}` : ''}
      size="sm"
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
            label="Void Entry"
            handleClick={handleSubmit}
            loading={mutation.isPending}
            type="button"
            styleObject={{
              baseColor: 'bg-red-600',
              hoverColor: 'hover:bg-red-700',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Voiding posts a reversing entry — the original stays in the ledger for audit. Auto-posted
          entries (fee payments, salaries) must be reversed from their source document instead.
        </p>
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Reason<span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Wrong account selected"
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
