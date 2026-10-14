'use client';
// Inventory at a glance: GET /inventory/summary + the low-stock item list.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, AlertTriangle, Wallet, Monitor, Truck, Store } from 'lucide-react';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { ASSET_STATUSES, itemStock } from '@/utils/inventory';
import { AssetStatusBadge, Spinner, cardCls, fmtQty, money, tdCls, thCls } from './inventoryShared';

const TONES = {
  red: 'text-red-600 dark:text-red-400',
  teal: 'text-teal-600 dark:text-teal-400',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

/** pendingShopSales may arrive as a count, an amount or `{ count, total }`. */
function pendingShopText(v) {
  if (v && typeof v === 'object') {
    const count = Number(v.count) || 0;
    const total = Number(v.total ?? v.amount) || 0;
    return `${count} · ${money(total)}`;
  }
  return String(Number(v) || 0);
}

function Card({ icon: Icon, label, value, tone, hint }) {
  return (
    <div className={cardCls}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        <Icon className={`w-4 h-4 ${TONES[tone] || ''}`} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      {hint && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</div>}
    </div>
  );
}

export default function OverviewPanel({ branchId }) {
  const { accessToken: token } = useTokenStore();
  const branchParam = branchId ? { branchId } : {};

  const summary = useQuery({
    queryKey: ['inventory-summary', branchId || ''],
    queryFn: () => fetchData({ url: '/inventory/summary', token, ...branchParam }),
    enabled: !!token,
  });
  const s = summary.data?.data || {};
  const assets = s.assets || {};
  const byStatus = assets.byStatus || {};

  const low = useQuery({
    queryKey: ['inventory-items', { lowStock: true, branchId: branchId || '', page: 1, limit: 50 }],
    queryFn: () =>
      fetchData({
        url: '/inventory/items',
        page: 1,
        limit: 50,
        token,
        lowStock: true,
        ...branchParam,
      }),
    enabled: !!token,
  });
  const lowRows = low.data?.data || [];

  return (
    <div className="space-y-6">
      {summary.error ? (
        <QueryErrorState error={summary.error} fallback="Could not load the inventory summary" />
      ) : summary.isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card icon={Boxes} label="Items" value={Number(s.items) || 0} />
            <Card
              icon={AlertTriangle}
              label="Low stock"
              value={Number(s.lowStockItems) || 0}
              tone="red"
            />
            <Card icon={Wallet} label="Stock value" value={money(s.stockValue)} tone="teal" />
            <Card
              icon={Monitor}
              label="Assets"
              value={Number(assets.count) || 0}
              hint={`Value ${money(assets.value)}`}
              tone="blue"
            />
            <Card
              icon={Truck}
              label="Supplier payables"
              value={money(s.suppliersPayable)}
              tone="amber"
            />
            <Card
              icon={Store}
              label="Pending shop sales"
              value={pendingShopText(s.pendingShopSales)}
              hint="Billed on the next fee voucher"
            />
          </div>
          <div className={cardCls}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Assets by status
            </h3>
            <div className="flex flex-wrap gap-3">
              {ASSET_STATUSES.map((st) => (
                <div key={st} className="flex items-center gap-2">
                  <AssetStatusBadge status={st} />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {Number(byStatus[st]?.count ?? byStatus[st]) || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Low-stock items
        </h3>
        {low.error ? (
          <QueryErrorState error={low.error} fallback="Could not load low-stock items" />
        ) : low.isLoading ? (
          <div className="py-6 flex justify-center">
            <Spinner />
          </div>
        ) : lowRows.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nothing at or below its reorder level.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className={thCls}>Item</th>
                  <th className={thCls}>SKU</th>
                  <th className={thCls}>In stock</th>
                  <th className={thCls}>Reorder level</th>
                </tr>
              </thead>
              <tbody>
                {lowRows.map((r) => {
                  const st = itemStock(r);
                  return (
                    <tr key={r._id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className={tdCls}>{r.name}</td>
                      <td className={`${tdCls} font-mono`}>{r.sku || '—'}</td>
                      <td className={`${tdCls} font-semibold text-red-600 dark:text-red-400`}>
                        {fmtQty(st.quantity)} {r.unit || ''}
                      </td>
                      <td className={tdCls}>{fmtQty(r.reorderLevel)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
