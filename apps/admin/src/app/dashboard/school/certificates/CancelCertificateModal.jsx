'use client';
// Cancel one certificate (reason required). Cancelling an SLC restores the
// student it marked as left.
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { certificateTypeLabel } from '@/utils/certificateText';
import ConfirmModal from './ConfirmModal';
import {
  inputCls,
  labelCls,
  errorCls,
  invalidateCertificateData,
  warningsOf,
} from './certificateShared';

export default function CancelCertificateModal({ certificate, onClose, onCancelled }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (payload) =>
      patchData({ url: `/certificates/${certificate._id}/cancel`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Certificate cancelled');
      warningsOf(res).forEach((w) => toast(w, { icon: '⚠️', duration: 8000 }));
      invalidateCertificateData(queryClient);
      onCancelled?.(res?.data);
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Could not cancel the certificate');
      toast.error(err.message || 'Could not cancel the certificate');
    },
  });

  if (!certificate) return null;

  const isSlc = certificate.type === 'slc';
  const name = certificate.snapshot?.studentName || certificate['snapshot.studentName'] || '';

  const submit = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('A reason is required to cancel');
      return;
    }
    setError('');
    mutation.mutate({ reason: trimmed });
  };

  return (
    <ConfirmModal
      isOpen={!!certificate}
      onClose={() => !mutation.isPending && onClose()}
      title="Cancel certificate"
      confirmLabel="Cancel certificate"
      cancelLabel="Close"
      confirmTone="danger"
      loading={mutation.isPending}
      onConfirm={submit}
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <strong>{certificate.serialNumber}</strong> · {certificateTypeLabel(certificate.type)}
          {name ? ` · ${name}` : ''}
        </div>
        {isSlc ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Cancelling this School Leaving Certificate restores the student: their previous academic
            status and seat in the section, their portal login and any transport assignments the SLC
            ended. This fails if the section is now full or inactive.
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            The certificate stays on record marked as cancelled, and verification will show it as
            cancelled.
          </p>
        )}
        <div>
          <label className={labelCls}>Reason for cancelling</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={300}
            className={inputCls}
          />
          {error && <p className={errorCls}>{error}</p>}
        </div>
      </div>
    </ConfirmModal>
  );
}
