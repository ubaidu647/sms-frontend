'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { currentPeriod } from '@/constants/accounting';

const inputCls =
  'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400';
const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

export default function ClosePeriodModal({ isOpen, onClose, branchId, isOrgLevel, branches = [] }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();

  const [period, setPeriod] = useState(currentPeriod());
  const [note, setNote] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPeriod(currentPeriod());
      setNote('');
      setSelectedBranch(isOrgLevel ? branchId || '' : '');
      setError('');
    }
  }, [isOpen, branchId, isOrgLevel]);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/ledger/period/close', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || `Period ${period} closed`);
      queryClient.invalidateQueries({ queryKey: ['accounting-periods'] });
      onClose();
    },
    onError: (err) => {
      const msg = err.message || 'Failed to close period';
      setError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!/^\d{4}-\d{2}$/.test(period)) {
      setError('Period must be in YYYY-MM format');
      return;
    }
    mutation.mutate({
      period,
      branchId: isOrgLevel ? selectedBranch || null : undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Close Accounting Period"
      subtitle="Once closed, entries dated in this month can no longer be posted."
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
            label="Close Period"
            handleClick={handleSubmit}
            loading={mutation.isPending}
            type="button"
            styleObject={{
              baseColor: 'bg-amber-600',
              hoverColor: 'hover:bg-amber-700',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className={labelCls}>
            Period<span className="text-red-500">*</span>
          </label>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={inputCls}
          />
        </div>
        {isOrgLevel && (
          <div>
            <label className={labelCls}>Scope</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className={inputCls}
            >
              <option value="">All branches (org-wide)</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="June closed after audit"
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
