'use client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { postData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import {
  inputCls,
  labelCls,
  cancelButtonStyle,
  primaryButtonStyle,
  invalidateFinanceQueries,
} from './financeShared';

const COPY = {
  expense: {
    title: 'New expense category',
    hint: 'For example: Generator diesel, Internet, Repairs.',
    placeholder: 'Generator diesel',
  },
  income: {
    title: 'New income source',
    hint: 'For example: Canteen rent, Donations, Sale of scrap.',
    placeholder: 'Canteen rent',
  },
};

/** Add an expense category or income source; it is filed in the books automatically. */
export default function CategoryFormModal({ isOpen, onClose, type = 'expense', onCreated }) {
  const copy = COPY[type] || COPY.expense;
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: (payload) => postData({ url: '/finance/categories', payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Category created');
      invalidateFinanceQueries(queryClient);
      if (res?.data) onCreated?.(res.data);
      onClose();
    },
    onError: (err) => {
      const msg = err.message || 'Could not create the category';
      setError(msg);
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    mutation.mutate({ type, name: name.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !mutation.isPending && onClose()}
      title={copy.title}
      subtitle={copy.hint}
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
            label="Create"
            handleClick={handleSubmit}
            loading={mutation.isPending}
            type="button"
            styleObject={primaryButtonStyle()}
          />
        </div>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className={labelCls}>
            Name<span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={copy.placeholder}
            maxLength={100}
            autoFocus
            className={inputCls}
          />
        </div>
      </div>
    </Modal>
  );
}
