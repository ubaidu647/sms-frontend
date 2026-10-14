'use client';
// Approve (optional note) / Reject (note required) / Cancel (confirm, optional
// note) for one leave request.
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { applicantName, formatLeaveRange } from '@/utils/leave';
import ConfirmModal from './ConfirmModal';
import {
  inputCls,
  labelCls,
  errorCls,
  invalidateLeaveData,
  warningsOf,
  leaveTypeLabel,
} from './leaveShared';

const MODES = {
  approve: {
    title: 'Approve leave',
    confirmLabel: 'Approve',
    tone: 'primary',
    noteLabel: 'Note (optional)',
    done: 'Leave approved',
  },
  reject: {
    title: 'Reject leave',
    confirmLabel: 'Reject',
    tone: 'danger',
    noteLabel: 'Reason for rejection',
    done: 'Leave rejected',
  },
  cancel: {
    title: 'Cancel leave',
    confirmLabel: 'Cancel leave',
    tone: 'warning',
    noteLabel: 'Note (optional)',
    done: 'Leave cancelled',
  },
};

export default function LeaveActionModal({ mode, request, onClose, onWarnings }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const cfg = MODES[mode] || MODES.approve;

  useEffect(() => {
    setNote('');
    setError('');
  }, [mode, request?._id]);

  const mutation = useMutation({
    mutationFn: (payload) => patchData({ url: `/leave/${request._id}/${mode}`, payload, token }),
    onSuccess: (res) => {
      toast.success(res?.message || cfg.done);
      const warnings = warningsOf(res);
      warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 8000 }));
      if (warnings.length) onWarnings?.(warnings);
      // Approve / cancel rewrite attendance rows (and may affect payslips).
      invalidateLeaveData(queryClient, { attendance: mode !== 'reject' });
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Action failed');
      toast.error(err.message || 'Action failed');
    },
  });

  const submit = () => {
    setError('');
    const trimmed = note.trim();
    if (mode === 'reject' && !trimmed) {
      setError('A note is required to reject');
      return;
    }
    mutation.mutate(trimmed ? { note: trimmed } : {});
  };

  if (!request) return null;

  return (
    <ConfirmModal
      isOpen={!!request}
      onClose={onClose}
      title={cfg.title}
      confirmLabel={cfg.confirmLabel}
      cancelLabel="Close"
      confirmTone={cfg.tone}
      loading={mutation.isPending}
      onConfirm={submit}
    >
      <div className="space-y-3">
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
          <div>
            <strong>{applicantName(request)}</strong> · {leaveTypeLabel(request.leaveType)}
          </div>
          <div>
            {formatLeaveRange(request.fromDate, request.toDate)} · {request.days ?? '—'} working
            day(s)
          </div>
        </div>
        {mode === 'approve' && request.applicantType === 'staff' && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Days within the remaining quota are paid; any beyond it become unpaid. Days already
            marked present/late/half-day are skipped.
          </p>
        )}
        {mode === 'cancel' && request.status === 'approved' && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            The attendance rows this leave wrote will be removed and its quota freed.
          </p>
        )}
        <div>
          <label className={labelCls}>{cfg.noteLabel}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            className={inputCls}
          />
          {error && <p className={errorCls}>{error}</p>}
        </div>
      </div>
    </ConfirmModal>
  );
}
