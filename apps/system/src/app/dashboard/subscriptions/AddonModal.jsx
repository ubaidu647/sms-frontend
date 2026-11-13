'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/component/Modal';
import Button from '@/component/Button';
import { fmtMoney } from '../packages/format';
import {
  ADDON_RESOURCES,
  MODULE_RESOURCE,
  addonRequest,
  effectiveLimit,
  moduleLabel,
} from '@/utils/addons';
import { formatGB } from '@/utils/storage';
import { useAddAddon, useAddonQuote } from './hooks/useSubscriptions';

const QUOTE_DEBOUNCE_MS = 400;

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';

const priceText = (p) => (p == null ? 'not listed' : fmtMoney(p));

const QuoteRow = ({ label, children, strong }) => (
  <div
    className={`flex justify-between gap-4 ${
      strong ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
    }`}
  >
    <span>{label}</span>
    <span className="text-right">{children}</span>
  </div>
);

// The limit before this purchase, as text ("∞" when unlimited).
const currentLimitText = (current, resource) => {
  if (resource === 'storageGB') {
    const gb = current?.storage ? current.storage.limitGB : effectiveLimit(current, 'storageGB');
    return gb == null ? 'Unlimited' : formatGB(gb);
  }
  return effectiveLimit(current, resource) ?? '∞';
};

// Buy extra units of a limit, or one gated module, mid-period. The server
// bills N × unit price × (days left / period days) on an `addon` invoice and
// raises the limit (opens the module) at once.
export default function AddonModal({ isOpen, onClose, schoolId, schoolName, current }) {
  const add = useAddAddon();
  const limitPrices = current?.addonPrices ?? {};
  const modulePrices = current?.moduleAddonPrices ?? {};
  const buyable = current?.buyableModules ?? [];

  const firstPriced =
    ADDON_RESOURCES.find(([key]) => limitPrices[key] != null)?.[0] ?? 'noOfStudents';
  const firstModule = buyable.find((k) => modulePrices[k] != null) ?? buyable[0] ?? '';
  const [resource, setResource] = useState(firstPriced);
  const [module, setModule] = useState(firstModule);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [method, setMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');

  const isModule = resource === MODULE_RESOURCE;
  const priceOf = (res, mod) =>
    (res === MODULE_RESOURCE ? modulePrices[mod] : limitPrices[res]) ?? null;
  const defaultUnitPrice = priceOf(resource, module);

  useEffect(() => {
    if (!isOpen) return;
    setResource(firstPriced);
    setModule(firstModule);
    setQuantity('');
    setUnitPrice(limitPrices[firstPriced] != null ? String(limitPrices[firstPriced]) : '');
    setMethod('');
    setTransactionId('');
    setError('');
    // Re-seed only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const seedPrice = (p) => setUnitPrice(p != null ? String(p) : '');
  const pickResource = (key) => {
    setResource(key);
    seedPrice(priceOf(key, module));
  };
  const pickModule = (key) => {
    setModule(key);
    seedPrice(priceOf(MODULE_RESOURCE, key));
  };

  const request = useMemo(
    () => addonRequest({ schoolId, resource, module, quantity, unitPrice, defaultUnitPrice }),
    [schoolId, resource, module, quantity, unitPrice, defaultUnitPrice],
  );

  // Debounce what the live quote asks for, so typing doesn't fire a request per key.
  const bodyKey = request.body ? JSON.stringify(request.body) : '';
  const [quoteBody, setQuoteBody] = useState(null);
  useEffect(() => {
    if (!isOpen || !bodyKey) {
      setQuoteBody(null);
      return undefined;
    }
    const t = setTimeout(() => setQuoteBody(JSON.parse(bodyKey)), QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [bodyKey, isOpen]);

  const quoteQuery = useAddonQuote(quoteBody);
  const quote = quoteBody && quoteQuery.isSuccess ? quoteQuery.data?.data : null;
  const quoteStale = !!bodyKey && JSON.stringify(quoteBody) !== bodyKey;

  const priceDiffers =
    defaultUnitPrice != null && unitPrice !== '' && Number(unitPrice) !== Number(defaultUnitPrice);

  const submit = () => {
    if (request.error) {
      setError(request.error);
      return;
    }
    setError('');
    const payload = { ...request.body };
    if (method || transactionId) {
      payload.paymentInfo = {
        method: method || undefined,
        transactionId: transactionId || undefined,
      };
    }
    add.mutate(payload, {
      onSuccess: () => onClose(),
      onError: (err) => setError(err?.message || 'Could not add the add-on.'),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add-on"
      subtitle={schoolName ? `Extra capacity for ${schoolName}` : undefined}
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
            label="Add"
            handleClick={submit}
            loading={add.isPending}
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

        <p className="rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-sm text-gray-600 dark:text-gray-300">
          {isModule ? 'The module opens at once.' : 'The limit rises at once.'} The school is billed
          for the days left in the current period on a separate add-on invoice. Prices are{' '}
          {isModule ? 'per module' : 'per extra unit'}, per{' '}
          {current?.packageSnapshot?.durationInDays ?? '-'}-day plan period.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="addon-resource" className={labelCls}>
              Add <span className="text-red-500">*</span>
            </label>
            <select
              id="addon-resource"
              className={inputCls}
              value={resource}
              onChange={(e) => pickResource(e.target.value)}
            >
              {ADDON_RESOURCES.map(([key, label]) => (
                <option key={key} value={key}>
                  {label} — {priceText(limitPrices[key])} per {key === 'storageGB' ? 'GB' : 'unit'}
                </option>
              ))}
              <option value={MODULE_RESOURCE}>Module</option>
            </select>
            {!isModule && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Current limit: {currentLimitText(current, resource)}
              </p>
            )}
          </div>
          {isModule ? (
            <div>
              <label htmlFor="addon-module" className={labelCls}>
                Module <span className="text-red-500">*</span>
              </label>
              {buyable.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2.5">
                  No module left to buy: the plan (with its add-ons) already opens every module.
                </p>
              ) : (
                <select
                  id="addon-module"
                  className={inputCls}
                  value={module}
                  onChange={(e) => pickModule(e.target.value)}
                >
                  {buyable.map((key) => (
                    <option key={key} value={key}>
                      {moduleLabel(key)} — {priceText(modulePrices[key])}
                    </option>
                  ))}
                </select>
              )}
              {(current?.addonModules ?? []).length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Already opened by add-ons:{' '}
                  {current.addonModules.map((k) => moduleLabel(k)).join(', ')}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="addon-quantity" className={labelCls}>
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="addon-quantity"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                className={inputCls}
                placeholder="e.g. 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="addon-unit-price" className={labelCls}>
            {isModule ? 'Price (per plan period)' : 'Unit price (per extra unit, per plan period)'}
            {defaultUnitPrice == null && <span className="text-red-500"> *</span>}
          </label>
          <input
            id="addon-unit-price"
            type="number"
            min="0"
            step="0.01"
            className={inputCls}
            placeholder={defaultUnitPrice == null ? 'Not listed on the plan — enter a price' : ''}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {defaultUnitPrice == null
              ? 'This plan lists no price for this add-on, so one must be entered.'
              : priceDiffers
                ? `Plan price: ${fmtMoney(defaultUnitPrice)}. This purchase uses ${fmtMoney(unitPrice)}.`
                : 'Defaults to the plan’s price. Change it for this purchase only.'}
          </p>
        </div>

        {request.body && (
          <div className="rounded-lg border border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 p-4 text-sm space-y-1">
            <p className="font-semibold text-teal-800 dark:text-teal-300">Quote</p>
            {quoteStale || quoteQuery.isFetching ? (
              <p className="text-gray-500 dark:text-gray-400">Calculating…</p>
            ) : quoteQuery.isError ? (
              <p className="text-red-600 dark:text-red-400">
                {quoteQuery.error?.message || 'Could not price this add-on.'}
              </p>
            ) : quote ? (
              <>
                {quote.label && <QuoteRow label="Add-on">{quote.label}</QuoteRow>}
                <QuoteRow label={quote.module ? 'Price' : 'Unit price'}>
                  {fmtMoney(quote.unitPrice)}
                  {quote.module ? '' : ` × ${quote.quantity}`}
                </QuoteRow>
                {quote.periodAmount != null && (
                  <QuoteRow label={`Full period (${quote.durationInDays} days)`}>
                    {fmtMoney(quote.periodAmount)}
                  </QuoteRow>
                )}
                <QuoteRow label="Days left">
                  {quote.remainingDays} of {quote.durationInDays}
                </QuoteRow>
                {quote.currentLimit != null && quote.newLimit != null && (
                  <QuoteRow label="Limit">
                    {quote.resource === 'storageGB'
                      ? `${formatGB(quote.currentLimit)} → ${formatGB(quote.newLimit)}`
                      : `${quote.currentLimit} → ${quote.newLimit}`}
                  </QuoteRow>
                )}
                <QuoteRow label="Amount due now" strong>
                  {fmtMoney(quote.amount)}
                </QuoteRow>
              </>
            ) : null}
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
      </div>
    </Modal>
  );
}
