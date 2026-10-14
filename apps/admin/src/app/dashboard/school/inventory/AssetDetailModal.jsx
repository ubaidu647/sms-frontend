'use client';
// Asset detail (GET /inventory/assets/:id) with its history timeline and actions.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, RefreshCw, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { retryUnless4xx } from '@/utils/queryError';
import { useTokenStore } from '@/store/tokenStore';
import { ASSET_ACTIVE_STATUSES, refName } from '@/utils/inventory';
import {
  AssetStatusBadge,
  Spinner,
  dangerBtn,
  fmtDate,
  money,
  secondaryBtn,
} from './inventoryShared';

const fmtAt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

const describe = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return refName(v, JSON.stringify(v));
  return String(v);
};

export default function AssetDetailModal({ assetId, onClose, canManage, onAction }) {
  const { accessToken: token } = useTokenStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-asset', assetId],
    queryFn: () => fetchData({ url: `/inventory/assets/${assetId}`, token }),
    enabled: !!token && !!assetId,
    retry: retryUnless4xx,
  });
  const a = data?.data?.asset || data?.data || null;
  const active = a && ASSET_ACTIVE_STATUSES.includes(a.status);
  const history = [...(a?.history || [])].sort((x, y) => new Date(y.at) - new Date(x.at));

  const info = a
    ? [
        ['Category', a.category],
        ['Branch', refName(a.branchId, '') || refName(a.branch, '')],
        ['Location', a.location],
        ['Assigned to', refName(a.assignedToStaffId, '') || refName(a.assignedTo, '')],
        ['Condition', a.condition],
        ['Purchase date', fmtDate(a.purchaseDate)],
        ['Cost', money(a.cost)],
        ['Purchase', a.purchaseId?.serialNumber || (a.purchaseId ? 'Linked purchase' : '')],
        ...(a.disposedAt
          ? [
              ['Disposed on', fmtDate(a.disposedAt)],
              ['Disposal reason', a.disposalReason],
              ['Disposal value', money(a.disposalValue)],
            ]
          : []),
      ]
    : [];

  return (
    <Modal
      isOpen={!!assetId}
      onClose={onClose}
      title={a ? `${a.tagNumber} · ${a.name}` : 'Asset'}
      size="lg"
      footer={
        canManage && a && active ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={() => onAction('edit', a)}>
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button type="button" className={secondaryBtn} onClick={() => onAction('status', a)}>
              <RefreshCw className="w-4 h-4" />
              Status
            </button>
            <button type="button" className={secondaryBtn} onClick={() => onAction('transfer', a)}>
              <ArrowRightLeft className="w-4 h-4" />
              Transfer
            </button>
            <button type="button" className={dangerBtn} onClick={() => onAction('dispose', a)}>
              <Trash2 className="w-4 h-4" />
              Dispose / lost
            </button>
          </div>
        ) : null
      }
    >
      {error ? (
        <QueryErrorState error={error} fallback="Could not load the asset" />
      ) : isLoading || !a ? (
        <div className="py-10 flex justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          <AssetStatusBadge status={a.status} />
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {info.map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-3 text-sm border-b border-gray-100 dark:border-gray-800 py-1"
              >
                <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
                <dd className="text-gray-900 dark:text-gray-100 text-right">{v || '—'}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">History</h4>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history yet.</p>
            ) : (
              <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-4">
                {history.map((h, i) => (
                  <li key={i} className="ml-4">
                    <span className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-teal-500" />
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {String(h.action || '').replace(/-/g, ' ')}
                    </div>
                    {(h.from !== undefined || h.to !== undefined) && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {describe(h.from)} → {describe(h.to)}
                      </div>
                    )}
                    {h.note && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">{h.note}</div>
                    )}
                    <div className="text-xs text-gray-400">
                      {fmtAt(h.at)}
                      {h.by ? ` · ${refName(h.by, '')}` : ''}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
