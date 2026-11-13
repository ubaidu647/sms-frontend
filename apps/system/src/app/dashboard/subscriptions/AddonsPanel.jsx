'use client';
import React, { useState } from 'react';
import { PackagePlus, Receipt, Trash2 } from 'lucide-react';
import ConfirmModal from '../organizations/ConfirmModal';
import { fmtMoney, fmtDate, INVOICE_STATUS_COLORS } from '../packages/format';
import {
  addonInvoice,
  addonPriceLabel,
  addonText,
  canRemoveAddon,
  moduleLabel,
  pricedAddons,
  pricedModules,
} from '@/utils/addons';
import { useRemoveAddon } from './hooks/useSubscriptions';

// The current subscription's add-ons (extra units bought mid-period) and the
// add-on prices that apply to it. Remove is offered only while an add-on's own
// invoice is unpaid; the server refuses a paid one (400, toasted).
export default function AddonsPanel({ current, schoolId, invoicesById, onAdd, onViewInvoice }) {
  const remove = useRemoveAddon();
  const [removing, setRemoving] = useState(null);
  const addons = current?.addons ?? [];
  const priced = pricedAddons(current?.addonPrices);
  const buyable = current?.buyableModules ?? [];
  const modulePrices = pricedModules(current?.moduleAddonPrices).filter((p) =>
    buyable.includes(p.key),
  );
  const days = current?.packageSnapshot?.durationInDays;

  return (
    <div className="mt-5 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Add-ons</h4>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-1.5 border border-teal-600 text-teal-700 dark:text-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors text-sm"
        >
          <PackagePlus className="w-4 h-4" />
          Add-on
        </button>
      </div>

      {addons.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No add-ons on this plan.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {addons.map((a) => {
            const inv = addonInvoice(a, invoicesById);
            const removable = canRemoveAddon(a, invoicesById);
            return (
              <li
                key={a._id}
                className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {addonText(a)} @ {fmtMoney(a.unitPrice)}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Added {fmtDate(a.addedAt)}
                    {inv?.type === 'renewal' ? ' · carried over on the renewal invoice' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {inv && (
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        INVOICE_STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  )}
                  {inv && onViewInvoice && (
                    <button
                      type="button"
                      onClick={() => onViewInvoice(inv)}
                      title="View invoice"
                      className="flex items-center gap-1 px-2.5 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-xs"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Invoice
                    </button>
                  )}
                  {removable && (
                    <button
                      type="button"
                      onClick={() => setRemoving(a)}
                      className="flex items-center gap-1 px-2.5 py-1 border border-red-300 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {priced.length
          ? `Plan prices (per extra unit, per ${days ?? '-'} days): ${priced
              .map((p) => `${addonPriceLabel(p.key)} ${fmtMoney(p.price)}`)
              .join(' · ')}`
          : 'This plan lists no add-on prices; enter a unit price when adding one.'}
      </p>
      {buyable.length > 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Modules to buy (per {days ?? '-'} days):{' '}
          {buyable
            .map((k) => {
              const p = modulePrices.find((m) => m.key === k);
              return `${moduleLabel(k)} ${p ? fmtMoney(p.price) : '(no price listed)'}`;
            })
            .join(' · ')}
        </p>
      )}

      <ConfirmModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        title="Remove add-on"
        message={
          removing
            ? `Remove ${addonText(removing)}? ${
                removing.resource === 'module' ? 'The module closes again' : 'The limit drops back'
              } and its unpaid invoice is voided.`
            : ''
        }
        confirmLabel="Remove add-on"
        confirmTone="danger"
        loading={remove.isPending}
        onConfirm={() =>
          remove.mutate(
            { schoolId, addonId: removing._id },
            // A 400 (e.g. already paid) is toasted with the server's message.
            { onSettled: () => setRemoving(null) },
          )
        }
      />
    </div>
  );
}
