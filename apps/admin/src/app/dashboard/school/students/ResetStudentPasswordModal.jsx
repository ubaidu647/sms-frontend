'use client';
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@/component/Modal';
import { postData } from '@/utils/api';

const btn = {
  secondary:
    'px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60',
  primary:
    'inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60',
  danger:
    'inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-60',
};

/**
 * Reset a student's password: confirm → result. The API returns a temporary
 * password once. It lives in this component's state only and is dropped when the
 * dialog closes. Deliberately not useMutation: that would keep the response in
 * the mutation cache after the dialog is gone.
 */
export default function ResetStudentPasswordModal({ student, onClose }) {
  const isOpen = !!student;
  const studentId = student?._id;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fresh state for every student the dialog opens on.
  useEffect(() => {
    setPending(false);
    setError('');
    setResult(null);
    setCopied(false);
  }, [studentId]);

  // Closing mid-request would lose the only copy of the new password.
  const handleClose = () => {
    if (pending) return;
    setError('');
    setResult(null);
    setCopied(false);
    onClose();
  };

  const handleConfirm = async () => {
    setPending(true);
    setError('');
    try {
      const res = await postData({ url: `/student/${studentId}/reset-password` });
      setResult(res?.data ?? {});
    } catch (err) {
      setError(err?.message || 'Could not reset the password');
    } finally {
      setPending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result?.temporaryPassword ?? '');
      setCopied(true);
    } catch {
      setCopied(false);
      toast.error('Could not copy. Select the password and copy it by hand.');
    }
  };

  const name = result?.name || student?.user?.name || 'this student';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset password"
      subtitle={student?.user?.name}
      size="sm"
      footer={
        result ? (
          <div className="flex justify-end w-full">
            <button type="button" className={btn.primary} onClick={handleClose}>
              Done
            </button>
          </div>
        ) : (
          <div className="flex gap-3 w-full justify-end">
            <button
              type="button"
              className={btn.secondary}
              disabled={pending}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button type="button" className={btn.danger} disabled={pending} onClick={handleConfirm}>
              {pending && <Loader2 className="w-4 h-4 animate-spin" />}
              Reset password
            </button>
          </div>
        )
      }
    >
      {result ? (
        <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
          <p>
            The password of <strong>{name}</strong>
            {result.email ? ` (${result.email})` : ''} was reset. They have been signed out
            everywhere.
          </p>
          {result.temporaryPassword ? (
            <>
              <div className="flex items-center gap-2">
                <code className="flex-1 select-all rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 font-mono text-base text-gray-900 dark:text-gray-100 break-all">
                  {result.temporaryPassword}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                This temporary password will not be shown again. Share it over a trusted channel; it
                must be changed at the next sign-in.
              </p>
            </>
          ) : (
            <p>No temporary password was returned. Reset again to get one.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <p>
            Reset the password of <strong>{name}</strong>? A temporary password will be generated
            and shown once. They will be signed out on every device.
          </p>
          {error && (
            <p role="alert" className="text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
