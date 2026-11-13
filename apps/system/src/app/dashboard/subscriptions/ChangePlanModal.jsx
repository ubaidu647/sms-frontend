'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { usePackages } from '../packages/hooks/usePackages';
import { fmtMoney, validateGraceDays } from '../packages/format';
import { planChangeEstimate } from '@/utils/planChangeEstimate';
import { addonText } from '@/utils/addons';
import { launchOfferPayload, offerAvailable, startPrice } from '@/utils/launchOffer';
import LaunchOfferField from './LaunchOfferField';
import { useChangePackage, usePlanInvoice } from './hooks/useSubscriptions';
import GracePeriodField from './GracePeriodField';
import PaymentDueField from './PaymentDueField';
import { paymentDueFormState, readPaymentDue, withPaymentDue } from '@/utils/paymentDue';

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

// Why the unused time of the current plan is not credited.
const INVOICE_NOTES = {
  unpaid: 'The current invoice is unpaid, so unused time earns no credit. It is voided on confirm.',
  void: 'The current invoice is void, so unused time earns no credit.',
  unknown: 'The current invoice status is not loaded, so unused time is not credited here.',
};

const CreditRow = ({ label, amount }) =>
  amount > 0 ? (
    <div className="flex justify-between text-gray-700 dark:text-gray-300">
      <span>{label}</span>
      <span>−{fmtMoney(amount)}</span>
    </div>
  ) : null;

export default function ChangePlanModal({ isOpen, onClose, schoolId, schoolName, current }) {
  const { data: pkgData } = usePackages({
    limit: 100,
    filters: { isActive: true },
    enabled: isOpen,
  });
  const packages = pkgData?.data ?? [];
  const change = useChangePackage();
  // Whether the current plan was paid decides its credit. A 404 resolves to
  // { data: null }: no invoice. Until it loads (or if it fails) status is unknown.
  // (Picked from the school's invoices: the by-subscription read may return a
  // newer add-on bill.) byId gives the add-ons' payment status.
  const { invoice, byId: addonInvoices } = usePlanInvoice(schoolId, isOpen ? current?._id : null);

  const [packageId, setPackageId] = useState('');
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [grace, setGrace] = useState('');
  const [blockUnpaid, setBlockUnpaid] = useState(true);
  const [dueDays, setDueDays] = useState('');
  const [applyOffer, setApplyOffer] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPackageId('');
      setMethod('');
      setTransactionId('');
      // Pre-fill the school's current grace so the admin sees and can keep it.
      setGrace(current?.gracePeriodInDays != null ? String(current.gracePeriodInDays) : '');
      const due = paymentDueFormState(current);
      setBlockUnpaid(due.block);
      setDueDays(due.days);
      setApplyOffer(true);
      setError('');
    }
  }, [isOpen, current]);

  const selected = packages.find((p) => p._id === packageId);

  // Preview only; the backend is authoritative.
  const estimate = useMemo(
    () =>
      selected
        ? planChangeEstimate({
            current,
            // The launch-offer price when it will apply.
            newPrice: startPrice(selected, applyOffer),
            invoice,
            // A plan change drops the add-ons; paid ones are credited.
            addons: current?.addons,
            addonInvoices,
          })
        : null,
    [selected, current, invoice, addonInvoices, applyOffer],
  );

  const submit = () => {
    if (!packageId) {
      setError('Please choose the new package.');
      return;
    }
    // Compare ids only: two packages may share a name. packageId may arrive populated.
    const currentPackageId = current?.packageId?._id ?? current?.packageId;
    if (currentPackageId && String(currentPackageId) === packageId) {
      setError('That is already the current plan. Use Renew instead.');
      return;
    }
    const graceError = validateGraceDays(grace);
    if (graceError) {
      setError(graceError);
      return;
    }
    const due = readPaymentDue({
      block: blockUnpaid,
      days: dueDays,
      previous: current?.paymentDueInDays,
    });
    if (due.error) {
      setError(due.error);
      return;
    }
    setError('');
    let payload = { schoolId, packageId, ...launchOfferPayload(selected, applyOffer) };
    if (method || transactionId) {
      payload.paymentInfo = {
        method: method || undefined,
        transactionId: transactionId || undefined,
      };
    }
    if (grace !== '' && grace != null) {
      payload.gracePeriodInDays = Number(grace);
    }
    payload = withPaymentDue(payload, due.value);
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

        {current?.addons?.length > 0 && (
          <p className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            Changing the plan drops this school&apos;s add-ons (
            {current.addons.map(addonText).join(', ')}). The unused value of paid add-ons is
            credited; unpaid add-on invoices are voided.
          </p>
        )}

        <div>
          <label className={labelCls}>
            New package <span className="text-red-500">*</span>
          </label>
          <select
            className={inputCls}
            value={packageId}
            onChange={(e) => {
              setPackageId(e.target.value);
              setApplyOffer(true);
            }}
          >
            <option value="">Select a package…</option>
            {packages.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} — {fmtMoney(p.price)} / {p.durationInDays}d
                {offerAvailable(p) ? ` (launch offer ${fmtMoney(p.launchOffer.price)})` : ''}
              </option>
            ))}
          </select>
        </div>

        <LaunchOfferField pkg={selected} apply={applyOffer} onChange={setApplyOffer} reuseNote />

        {estimate && (
          <div className="rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 p-4 text-sm space-y-1">
            <p className="font-semibold text-teal-800 dark:text-teal-300">
              Estimated billing ({estimate.direction})
            </p>
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>
                {selected?.name} plan
                {offerAvailable(selected) && applyOffer ? ' (launch offer)' : ''}
              </span>
              <span>{fmtMoney(startPrice(selected, applyOffer))}</span>
            </div>
            <CreditRow label="Credit for unused time" amount={estimate.unusedCredit} />
            <CreditRow
              label="Credit restored from voided invoice"
              amount={estimate.restoredCredit}
            />
            <CreditRow label="Carried-forward credit" amount={estimate.carriedCredit} />
            <CreditRow label="Add-ons unused credit" amount={estimate.addonCredit} />
            <div className="flex justify-between font-medium text-gray-900 dark:text-gray-100">
              <span>Amount due</span>
              <span>{fmtMoney(estimate.amountDue)}</span>
            </div>
            {estimate.creditCarriedForward > 0 && (
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Credit carried forward to the new plan</span>
                <span>{fmtMoney(estimate.creditCarriedForward)}</span>
              </div>
            )}
            {INVOICE_NOTES[estimate.invoiceStatus] && (
              <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">
                {INVOICE_NOTES[estimate.invoiceStatus]}
              </p>
            )}
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

        <PaymentDueField
          block={blockUnpaid}
          onBlockChange={setBlockUnpaid}
          days={dueDays}
          onDaysChange={setDueDays}
          hint="Leave unchanged (or empty) to keep the current setting."
        />
      </div>
    </Modal>
  );
}
