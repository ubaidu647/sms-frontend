'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { usePackages } from '../packages/hooks/usePackages';
import { fmtMoney, validateGraceDays } from '../packages/format';
import { useChangePackage } from './hooks/useSubscriptions';
import GracePeriodField from './GracePeriodField';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function ChangePlanModal({ isOpen, onClose, schoolId, schoolName, current }) {
  const { data: pkgData } = usePackages({
    limit: 100,
    filters: { isActive: true },
    enabled: isOpen,
  });
  const packages = pkgData?.data ?? [];
  const change = useChangePackage();

  const [packageId, setPackageId] = useState('');
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [grace, setGrace] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPackageId('');
      setMethod('');
      setTransactionId('');
      // Pre-fill the school's current grace so the admin sees and can keep it.
      setGrace(current?.gracePeriodInDays != null ? String(current.gracePeriodInDays) : '');
      setError('');
    }
  }, [isOpen, current]);

  const selected = packages.find((p) => p._id === packageId);

  // Client-side estimate mirroring the documented proration. The backend is
  // authoritative; this is a preview only.
  const estimate = useMemo(() => {
    const snap = current?.packageSnapshot;
    if (!selected || !snap?.price || !snap?.durationInDays || !current?.endDate) return null;
    const remainingDays = Math.max(0, (new Date(current.endDate) - new Date()) / MS_PER_DAY);
    const credit = snap.price * (remainingDays / snap.durationInDays);
    const amountDue = Math.max(0, selected.price - credit);
    const direction = selected.price >= snap.price ? 'Upgrade' : 'Downgrade';
    return { credit, amountDue, direction };
  }, [selected, current]);

  const submit = () => {
    if (!packageId) {
      setError('Please choose the new package.');
      return;
    }
    if (current?.packageId === packageId || current?.packageSnapshot?.name === selected?.name) {
      setError('That is already the current plan. Use Renew instead.');
      return;
    }
    const graceError = validateGraceDays(grace);
    if (graceError) {
      setError(graceError);
      return;
    }
    setError('');
    const payload = { schoolId, packageId };
    if (method || transactionId) {
      payload.paymentInfo = {
        method: method || undefined,
        transactionId: transactionId || undefined,
      };
    }
    if (grace !== '' && grace != null) {
      payload.gracePeriodInDays = Number(grace);
    }
    change.mutate(payload, { onSuccess: () => onClose() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Plan"
      subtitle={schoolName ? `For ${schoolName}` : undefined}
      size="lg"
      footer={
        <div className="flex gap-3 w-full justify-end">
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
            label={estimate ? estimate.direction : 'Change Plan'}
            handleClick={submit}
            loading={change.isPending}
            type="button"
            styleObject={{
              baseColor: 'bg-teal-600',
              hoverColor: 'hover:bg-teal-700',
              rounded: 'rounded-full',
              size: 'px-8 py-3 text-md min-h-[3rem]',
              textColor: 'text-white',
            }}
          />
        </div>
      }
    >
      <div className="space-y-5">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {current?.packageSnapshot && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-sm text-gray-600 dark:text-gray-300">
            Current plan: <span className="font-medium">{current.packageSnapshot.name}</span> —{' '}
            {fmtMoney(current.packageSnapshot.price)} / {current.packageSnapshot.durationInDays}d
          </div>
        )}

        <div>
          <label className={labelCls}>
            New package <span className="text-red-500">*</span>
          </label>
          <select
            className={inputCls}
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
          >
            <option value="">Select a package…</option>
            {packages.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — {fmtMoney(p.price)} / {p.durationInDays}d
              </option>
            ))}
          </select>
        </div>

        {estimate && (
          <div className="rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 p-4 text-sm space-y-1">
            <p className="font-semibold text-teal-800 dark:text-teal-300">
              Estimated billing ({estimate.direction})
            </p>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Credit for unused time</span>
              <span>−{fmtMoney(estimate.credit)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-900 dark:text-gray-100">
              <span>Amount due</span>
              <span>{fmtMoney(estimate.amountDue)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              Estimate only — a fresh {selected?.durationInDays}-day cycle starts on confirm. The
              server calculates the final amount.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Payment method</label>
            <input
              className={inputCls}
              placeholder="e.g. bank"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Transaction ID</label>
            <input
              className={inputCls}
              placeholder="e.g. TX1"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
          </div>
        </div>

        <GracePeriodField
          value={grace}
          onChange={setGrace}
          hint="Leave unchanged to keep the current grace period."
        />
      </div>
    </Modal>
  );
}
