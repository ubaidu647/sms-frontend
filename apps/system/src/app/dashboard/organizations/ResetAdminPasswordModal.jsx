'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/component/Modal';
import { PASSWORD_MAX, PASSWORD_MIN, newPasswordProblem } from '@/utils/changePassword';
import { useResetSchoolAdminPassword, useSchoolAdmins } from './hooks/useOrganization';

const btn = {
  secondary:
    'px-6 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60',
  primary:
    'inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60',
  danger:
    'inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-60',
};

const inputCls =
  'w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500';

/**
 * Reset the password of one of a school's admin accounts.
 *
 * Steps: pick the admin and how (generate a temporary password, or set one) →
 * confirm → result. A generated password is shown once, here, and dropped from
 * memory when the dialog closes; the API never returns it again.
 */
export default function ResetAdminPasswordModal({ school, onClose }) {
  const isOpen = !!school;
  const schoolId = school?._id;
  const admins = useSchoolAdmins(schoolId, { enabled: isOpen });
  const reset = useResetSchoolAdminPassword();

  const [step, setStep] = useState('form'); // form | confirm | result
  const [userId, setUserId] = useState('');
  const [mode, setMode] = useState('generate'); // generate | set
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fresh state for every school the dialog opens on.
  useEffect(() => {
    setStep('form');
    setUserId('');
    setMode('generate');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setResult(null);
    setCopied(false);
    reset.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const list = useMemo(() => admins.data ?? [], [admins.data]);
  // Default to the primary admin (the account created at registration).
  useEffect(() => {
    if (!userId && list.length > 0) {
      setUserId(String((list.find((a) => a.isPrimary) ?? list[0])._id));
    }
  }, [list, userId]);

  const target = list.find((a) => String(a._id) === userId);

  const handleClose = () => {
    // Drop the temporary password with the dialog.
    setResult(null);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleContinue = () => {
    if (!target) {
      setError('Select the admin account to reset');
      return;
    }
    if (mode === 'set') {
      const problem = newPasswordProblem(newPassword, confirmPassword);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setError('');
    setStep('confirm');
  };

  const handleConfirm = () => {
    setError('');
    reset.mutate(
      { schoolId, userId, newPassword: mode === 'set' ? newPassword : undefined },
      {
        onSuccess: (res) => {
          setResult(res?.data ?? {});
          setNewPassword('');
          setConfirmPassword('');
          setStep('result');
        },
        onError: (err) => {
          setError(err?.message || 'Could not reset the password');
          setStep('form');
        },
      },
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result?.temporaryPassword ?? '');
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  let body;
  let footer;
  if (step === 'result') {
    body = (
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        <p>
          The password of <strong>{result?.name || target?.name}</strong> (
          {result?.email || target?.email}) was reset. They have been signed out everywhere.
        </p>
        {result?.temporaryPassword ? (
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
              This temporary password will not be shown again. Share it with the admin over a
              trusted channel and ask them to change it after signing in.
            </p>
          </>
        ) : (
          <p>The new password you entered is now active.</p>
        )}
      </div>
    );
    footer = (
      <div className="flex justify-end w-full">
        <button type="button" className={btn.primary} onClick={handleClose}>
          Done
        </button>
      </div>
    );
  } else if (step === 'confirm') {
    body = (
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Reset the password of <strong>{target?.name}</strong> ({target?.email}) at{' '}
        <strong>{school?.name}</strong>?{' '}
        {mode === 'generate'
          ? 'A temporary password will be generated and shown once.'
          : 'The password you entered will replace the current one.'}{' '}
        They will be signed out on every device.
      </p>
    );
    footer = (
      <div className="flex gap-3 w-full justify-end">
        <button
          type="button"
          className={btn.secondary}
          disabled={reset.isPending}
          onClick={() => setStep('form')}
        >
          Back
        </button>
        <button
          type="button"
          className={btn.danger}
          disabled={reset.isPending}
          onClick={handleConfirm}
        >
          {reset.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Reset password
        </button>
      </div>
    );
  } else {
    body = (
      <div className="space-y-5 text-sm">
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Admin account</p>
          {admins.isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading admins…</p>
          ) : admins.isError ? (
            <p className="text-red-600 dark:text-red-400">
              {admins.error?.response?.data?.message ||
                admins.error?.message ||
                'Could not load the admins'}
            </p>
          ) : list.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">This school has no admin account.</p>
          ) : (
            <div className="space-y-2">
              {list.map((a) => (
                <label
                  key={a._id}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="radio"
                    name="reset-admin"
                    value={String(a._id)}
                    checked={userId === String(a._id)}
                    onChange={() => setUserId(String(a._id))}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-gray-900 dark:text-gray-100">
                      {a.name}
                      {a.isPrimary && (
                        <span className="ml-2 rounded-full bg-teal-100 text-teal-800 px-2 py-0.5 text-xs">
                          Primary
                        </span>
                      )}
                      {a.isActive === false && (
                        <span className="ml-2 rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-xs">
                          Blocked
                        </span>
                      )}
                    </span>
                    <span className="block text-gray-500 dark:text-gray-400 truncate">
                      {a.email}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">New password</p>
          <label className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-300">
            <input
              type="radio"
              name="reset-mode"
              checked={mode === 'generate'}
              onChange={() => setMode('generate')}
            />
            Generate a temporary password
          </label>
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <input
              type="radio"
              name="reset-mode"
              checked={mode === 'set'}
              onChange={() => setMode('set')}
            />
            Set a password
          </label>
          {mode === 'set' && (
            <div className="mt-3 space-y-3">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                aria-label="New password"
                value={newPassword}
                maxLength={PASSWORD_MAX}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                aria-label="Confirm new password"
                value={confirmPassword}
                maxLength={PASSWORD_MAX}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {PASSWORD_MIN}–{PASSWORD_MAX} characters.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
    footer = (
      <div className="flex gap-3 w-full justify-end">
        <button type="button" className={btn.secondary} onClick={handleClose}>
          Cancel
        </button>
        <button
          type="button"
          className={btn.primary}
          disabled={!target || admins.isLoading}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset admin password"
      subtitle={school?.name}
      size="sm"
      footer={footer}
    >
      {body}
    </Modal>
  );
}
