'use client';
import React from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';

const TONE = {
  danger: { baseColor: 'bg-red-600', hoverColor: 'hover:bg-red-700' },
  warning: { baseColor: 'bg-amber-600', hoverColor: 'hover:bg-amber-700' },
  primary: { baseColor: 'bg-teal-600', hoverColor: 'hover:bg-teal-700' },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  loading = false,
  onConfirm,
}) {
  const tone = TONE[confirmTone] || TONE.primary;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            label={cancelLabel}
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
            label={confirmLabel}
            handleClick={onConfirm}
            loading={loading}
            type="button"
            styleObject={{
              baseColor: tone.baseColor,
              hoverColor: tone.hoverColor,
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
    </Modal>
  );
}
