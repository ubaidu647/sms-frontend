'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { usePackages } from '../packages/hooks/usePackages';
import { fmtMoney, fmtDate, validateGraceDays } from '../packages/format';
import { planChangeEstimate } from '@/utils/planChangeEstimate';
import { paymentDueFormState, readPaymentDue, withPaymentDue } from '@/utils/paymentDue';
import { addonSummary } from '@/utils/addons';
import { livePriceLock, renewalPrice } from '@/utils/launchOffer';
import { useRenewSubscription, usePlanInvoice } from './hooks/useSubscriptions';
import GracePeriodField from './GracePeriodField';
import PaymentDueField from './PaymentDueField';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const START_OPTIONS = [
  {
    value: 'today',
    label: 'From today',
    help: 'Remaining days are credited as money. The new period starts now.',
  },
  {
    value: 'endDate',
    label: 'After current end date',
    help: 'Remaining days are kept, full price. The new period starts when the current one ends.',
  },
];

// Renew the school's current package. The server re-snapshots the catalog
// package, so price and length come from it when it is still listed.
export default function RenewSubscriptionModal({ isOpen, onClose, schoolId, schoolName, current }) {
  const renew = useRenewSubscription();
  const { data: pkgData } = usePackages({
    limit: 100,
    filters: { isActive: true },
    enabled: isOpen,
  });
  // The plan invoice (null: none on record; undefined: not known yet) and
  // every invoice by id, for the add-ons' payment status.
  const { invoice, byId: addonInvoices } = usePlanInvoice(schoolId, isOpen ? current?._id : null);
  const addons = useMemo(() => current?.addons ?? [], [current]);
  const hasAddons = addons.length > 0;

  const [startFrom, setStartFrom] = useState('today');
  const [grace, setGrace] = useState('');
  const [blockUnpaid, setBlockUnpaid] = useState(true);
  const [dueDays, setDueDays] = useState('');
  const [keepAddons, setKeepAddons] = useState(true);
  const [error, setError] = useState('');
  // "Now" for the preview, re-read each time the dialog opens.
  const [openedAt, setOpenedAt] = useState(() => Date.now());

  useEffect(() => {
    if (isOpen) {
      setOpenedAt(Date.now());
      setStartFrom('today');
      setGrace(current?.gracePeriodInDays != null ? String(current.gracePeriodInDays) : '');
      const due = paymentDueFormState(current);
      setBlockUnpaid(due.block);
      setDueDays(due.days);
      setKeepAddons(true);
      setError('');
    }
  }, [isOpen, current]);

  const currentPackageId = String(current?.packageId?._id ?? current?.packageId ?? '');
  const catalog = (pkgData?.data ?? []).find((p) => String(p._id) === currentPackageId);
  // A running launch-offer lock keeps its price on renewal.
  const lock = livePriceLock(current, openedAt);
  const price = renewalPrice({ current, catalogPrice: catalog?.price, nowMs: openedAt });
  const durationInDays = catalog?.durationInDays ?? current?.packageSnapshot?.durationInDays;
  // The renewed plan's modules: a module add-on it now includes is not carried.
  const planFeatures = catalog ? catalog.features : current?.packageSnapshot?.features;

  // Preview of both options; the server is authoritative.
  const estimates = useMemo(() => {
    const of = (mode) =>
      planChangeEstimate({
        current,
        newPrice: price,
        invoice,
        nowMs: openedAt,
        startFrom: mode,
        durationInDays,
        addons,
        keepAddons: hasAddons && keepAddons,
        addonInvoices,
        planFeatures,
      });
    return { today: of('today'), endDate: of('endDate') };
  }, [
    current,
    price,
    invoice,
    durationInDays,
    openedAt,
    addons,
    hasAddons,
    keepAddons,
    addonInvoices,
    planFeatures,
  ]);

  const selected = estimates[startFrom];
  const pastEnd = !!selected && !estimates.endDate?.extendFromEnd;

  // When the bill would block if left unpaid, for the chosen option.
  const due = readPaymentDue({
    block: blockUnpaid,
    days: dueDays,
    previous: current?.paymentDueInDays,
  });
  const effectiveDueDays = due.value === undefined ? current?.paymentDueInDays : due.value;
  const dueAt =
    selected && selected.amountDue > 0 && typeof effectiveDueDays === 'number'
      ? new Date(selected.periodFrom.getTime() + effectiveDueDays * MS_PER_DAY)
      : null;

  const submit = () => {
    const graceError = validateGraceDays(grace);
    if (graceError) {
      setError(graceError);
      return;
    }
    if (due.error) {
      setError(due.error);
      return;
    }
    if (startFrom === 'endDate' && selected?.unpaidBlocksExtend) {
      setError(
        'The current invoice (or an add-on invoice) is not paid yet, so its remaining days cannot be carried over. Mark it paid first, or renew from today.',
      );
      return;
    }
    setError('');
    let payload = { schoolId, startFrom };
    if (hasAddons) payload.keepAddons = keepAddons;
    if (grace !== '' && grace != null) payload.gracePeriodInDays = Number(grace);
    payload = withPaymentDue(payload, due.value);
    renew.mutate(payload, {
      onSuccess: () => onClose(),
      // e.g. 400 "…not paid yet… Mark it paid first, or renew from today."
      onError: (err) => setError(err?.message || 'Renewal failed.'),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renew Subscription"
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
            label="Renew"
            handleClick={submit}
            loading={renew.isPending}
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
            Renewing <span className="font-medium">{current.packageSnapshot.name}</span> —{' '}
            {fmtMoney(price)} / {durationInDays}d{' '}
            {lock
              ? `at the launch offer price, locked until ${fmtDate(lock.until)}`
              : 'at current catalog pricing'}
            . Current period ends {fmtDate(current.endDate)}.
            {!lock && current.priceLock?.price != null && (
              <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                The launch offer price ({fmtMoney(current.priceLock.price)}) ended on{' '}
                {fmtDate(current.priceLock.until)}, so this renewal is at the normal price.
              </span>
            )}
          </div>
        )}

        <fieldset>
          <legend className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            New period starts
          </legend>
          <div className="space-y-2">
            {START_OPTIONS.map((opt) => {
              const est = estimates[opt.value];
              const checked = startFrom === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                    checked
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="renew-start"
                    className="mt-1 h-4 w-4 accent-teal-600"
                    value={opt.value}
                    checked={checked}
                    onChange={() => setStartFrom(opt.value)}
                  />
                  <span className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {opt.help}
                    </span>
                    {est?.newEndDate && (
                      <span className="block text-xs text-gray-700 dark:text-gray-300 mt-1">
                        New end date: {fmtDate(est.newEndDate)} · Amount due ≈{' '}
                        {fmtMoney(est.amountDue)}
                      </span>
                    )}
                    {est && (est.addonCharge > 0 || est.addonCredit > 0) && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {est.addonCharge > 0 && `Includes add-ons ${fmtMoney(est.addonCharge)}`}
                        {est.addonCharge > 0 && est.addonCredit > 0 && ' · '}
                        {est.addonCredit > 0 &&
                          `add-on unused credit −${fmtMoney(est.addonCredit)}`}
                      </span>
                    )}
                    {opt.value === 'endDate' && est?.unpaidBlocksExtend && (
                      <span className="block text-xs text-amber-700 dark:text-amber-400 mt-1">
                        {invoice?.status === 'unpaid'
                          ? 'The current invoice is unpaid: mark it paid first, or renew from today.'
                          : 'An add-on invoice is unpaid: mark it paid first, or renew from today.'}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {pastEnd && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              The current period has already ended, so both options start today.
            </p>
          )}
          {selected?.invoiceStatus === 'unknown' && startFrom === 'today' && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              The current invoice is still loading, so the credit for remaining days is not shown
              yet.
            </p>
          )}
          {dueAt && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              If unpaid, the school becomes read-only after {fmtDate(dueAt)}.
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Estimate only — the server calculates the final amount.
          </p>
        </fieldset>

        {hasAddons && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-teal-600"
                checked={keepAddons}
                onChange={(e) => setKeepAddons(e.target.checked)}
              />
              <span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  Keep add-ons (billed for the new period)
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {addons.map((a) => addonSummary(a, fmtMoney)).join(' · ')}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {keepAddons
                    ? 'Carried over at the same unit price for the full new period. A module the plan now includes itself is not carried.'
                    : 'Dropped: the limits fall back to the plan, and the unused value of paid add-ons is credited.'}
                </span>
              </span>
            </label>
          </div>
        )}

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
