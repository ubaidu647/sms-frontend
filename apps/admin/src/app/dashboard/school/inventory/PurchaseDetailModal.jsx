'use client';
// Purchase detail (GET /inventory/purchases/:id): lines, payment split, the
// asset tags it created, and void with a reason.
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Ban } from 'lucide-react';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import {
  creditRemainderPaisa,
  fromPaisa,
  lineAmountPaisa,
  refName,
  toPaisa,
} from '@/utils/inventory';
import {
  ReasonModal,
  Spinner,
  StatusBadge,
  dangerBtn,
  fmtDate,
  fmtQty,
  invalidateInventoryPurchases,
  lineItemName,
  money,
  tdCls,
  thCls,
} from './inventoryShared';

/** Created assets may arrive as `assets` rows or `assetTags` strings. */
export function createdTagsOf(p) {
  if (!p) return [];
  const list = p.assets || p.createdAssets || p.assetTags || [];
  return list
    .map((a) => (typeof a === 'string' ? { tagNumber: a } : a))
    .filter((a) => a?.tagNumber);
}

const lineDescription = (l) => {
  if (l.kind === 'expense') return l.description || 'Expense';
  if (l.kind === 'asset') return [l.name, l.category].filter(Boolean).join(' · ');
  return lineItemName(l);
};

export default function PurchaseDetailModal({ purchaseId, initial, onClose, canManage }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [voidOpen, setVoidOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-purchase', purchaseId],
    queryFn: () => fetchData({ url: `/inventory/purchases/${purchaseId}`, token }),
    enabled: !!token && !!purchaseId,
    retry: retryUnless4xx,
  });
  const raw = data?.data;
  const p = raw?.purchase || raw || null;
  const fetchedTags = createdTagsOf(raw?.purchase ? raw : p);
  const tags = fetchedTags.length ? fetchedTags : createdTagsOf(initial);

  const voidMutation = useMutation({
    mutationFn: (reason) =>
      patchData({ url: `/inventory/purchases/${purchaseId}/void`, payload: { reason }, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Purchase voided');
      invalidateInventoryPurchases(queryClient);
      setVoidOpen(false);
    },
    onError: (err) => toast.error(err.message || 'Could not void the purchase'),
  });

  const credit = p ? fromPaisa(creditRemainderPaisa(toPaisa(p.total), toPaisa(p.paidAmount))) : 0;

  return (
    <>
      <Modal
        isOpen={!!purchaseId}
        onClose={onClose}
        title={`Purchase ${p?.serialNumber || ''}`}
        subtitle={p ? `${fmtDate(p.date)} · ${refName(p.supplierId || p.supplier, '')}` : ''}
        size="lg"
        footer={
          canManage && p?.status === 'posted' ? (
            <button type="button" className={dangerBtn} onClick={() => setVoidOpen(true)}>
              <Ban className="w-4 h-4" />
              Void purchase
            </button>
          ) : null
        }
      >
        {error ? (
          <QueryErrorState error={error} fallback="Could not load the purchase" />
        ) : isLoading || !p ? (
          <div className="py-10 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <StatusBadge status={p.status} />
              {p.billNumber && <span>Bill no. {p.billNumber}</span>}
              {p.journalEntryId && <span className="text-xs text-gray-500">Posted to ledger</span>}
            </div>
            {p.voidReason && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Void reason: {p.voidReason}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className={thCls}>Type</th>
                    <th className={thCls}>Description</th>
                    <th className={thCls}>Qty</th>
                    <th className={thCls}>Unit cost</th>
                    <th className={thCls}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(p.lines || []).map((l, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className={`${tdCls} capitalize`}>{l.kind}</td>
                      <td className={tdCls}>{lineDescription(l)}</td>
                      <td className={tdCls}>{l.kind === 'expense' ? '—' : fmtQty(l.quantity)}</td>
                      <td className={tdCls}>{l.kind === 'expense' ? '—' : money(l.unitCost)}</td>
                      <td className={tdCls}>
                        {money(
                          l.kind === 'expense'
                            ? l.amount
                            : (l.amount ?? fromPaisa(lineAmountPaisa(l.quantity, l.unitCost))),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="font-bold text-gray-900 dark:text-gray-100">{money(p.total)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">
                  Paid{p.paymentMethod ? ` (${p.paymentMethod})` : ''}
                </div>
                <div className="text-gray-900 dark:text-gray-100">{money(p.paidAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">On credit</div>
                <div className="font-semibold text-amber-700 dark:text-amber-400">
                  {money(credit)}
                </div>
              </div>
            </div>
            {tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Assets created ({tags.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map((a) => (
                    <span
                      key={a.tagNumber}
                      className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono text-gray-800 dark:text-gray-200"
                      title={a.name || ''}
                    >
                      {a.tagNumber}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      <ReasonModal
        isOpen={voidOpen}
        onClose={() => setVoidOpen(false)}
        title={`Void purchase ${p?.serialNumber || ''}`}
        message="Stock, assets and the supplier balance from this purchase are reversed. Refused if the stock was already used or a created asset is no longer in store / in use."
        loading={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutate(reason)}
      />
    </>
  );
}
