'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { usePackages } from '../packages/hooks/usePackages';
import { fmtMoney, validateGraceDays } from '../packages/format';
import { useAssignSubscription } from './hooks/useSubscriptions';
import GracePeriodField from './GracePeriodField';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

const LIMIT_KEYS = [
  ['noOfStudents', 'Students'],
  ['noOfBranches', 'Branches'],
  ['noOfStaffs', 'Staff'],
  ['noOfSections', 'Sections'],
];

export default function AssignSubscriptionModal({ isOpen, onClose, schoolId, schoolName }) {
  const { data: pkgData } = usePackages({
    limit: 100,
    filters: { isActive: true },
    enabled: isOpen,
  });
  const packages = pkgData?.data ?? [];
  const assign = useAssignSubscription();

  const [packageId, setPackageId] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [customLimits, setCustomLimits] = useState({});
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [grace, setGrace] = useState('0'); // new sub has no prior plan → default 0
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPackageId('');
      setUseCustom(false);
      setCustomLimits({});
      setMethod('');
      setTransactionId('');
      setGrace('0');
      setError('');
    }
  }, [isOpen]);

  const selected = packages.find((p) => p._id === packageId);

  const submit = () => {
    if (!packageId) {
      setError('Please choose a package.');
      return;
    }
    const graceError = validateGraceDays(grace);
    if (graceError) {
      setError(graceError);
      return;
    }
    setError('');

    const payload = { schoolId, packageId };

    if (useCustom) {
      const limits = Object.fromEntries(
        Object.entries(customLimits)
          .filter(([, v]) => v !== '' && v != null)
          .map(([k, v]) => [k, Number(v)]),
      );
      if (Object.keys(limits).length) payload.customLimits = limits;
    }
    if (method || transactionId) {
      payload.paymentInfo = {
        method: method || undefined,
        transactionId: transactionId || undefined,
      };
    }
    if (grace !== '' && grace != null) {
      payload.gracePeriodInDays = Number(grace);
    }

    assign.mutate(payload, { onSuccess: () => onClose() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Subscription"
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
            label="Assign"
            handleClick={submit}
            loading={assign.isPending}
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

        <div>
          <label className={labelCls}>
            Package <span className="text-red-500">*</span>
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

        {selected && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-sm text-gray-600 dark:text-gray-300">
            Default limits — Students {selected.limits?.noOfStudents}, Branches{' '}
            {selected.limits?.noOfBranches}, Staff {selected.limits?.noOfStaffs}, Sections{' '}
            {selected.limits?.noOfSections}
          </div>
        )}

        <div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-teal-600"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
            />
            Override limits for this school
          </label>
          {useCustom && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              {LIMIT_KEYS.map(([key, lbl]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {lbl}
                  </label>
                  <input
                    type="number"
                    className={inputCls}
                    placeholder={selected?.limits?.[key] ?? ''}
                    value={customLimits[key] ?? ''}
                    onChange={(e) =>
                      setCustomLimits((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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

        <GracePeriodField value={grace} onChange={setGrace} />
      </div>
    </Modal>
  );
}
