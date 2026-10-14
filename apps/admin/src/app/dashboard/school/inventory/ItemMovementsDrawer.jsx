'use client';
// Stock ledger of one item: GET /inventory/items/:id/movements.
import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { MOVEMENT_TYPE_LABELS } from '@/utils/inventory';
import {
  Drawer,
  Spinner,
  fmtDate,
  fmtQty,
  inputCls,
  labelCls,
  money,
  secondaryBtn,
  tdCls,
  thCls,
} from './inventoryShared';

const LIMIT = 50;

export default function ItemMovementsDrawer({ item, branchId, onClose }) {
  const { accessToken: token } = useTokenStore();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    ...(branchId ? { branchId } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-movements', item?._id, { ...params, page }],
    queryFn: () =>
      fetchData({
        url: `/inventory/items/${item._id}/movements`,
        page,
        limit: LIMIT,
        token,
        ...params,
      }),
    enabled: !!token && !!item?._id,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <Drawer
      isOpen={!!item}
      onClose={onClose}
      title={item ? `Movements — ${item.name}` : ''}
      subtitle={item?.sku}
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className={labelCls}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className={inputCls}
          />
        </div>
      </div>
      {error ? (
        <QueryErrorState error={error} fallback="Could not load movements" />
      ) : isLoading ? (
        <div className="py-10 flex justify-center">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No movements in this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className={thCls}>Date</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Qty</th>
                <th className={thCls}>Unit cost</th>
                <th className={thCls}>Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const q = Number(m.quantity) || 0;
                return (
                  <tr key={m._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className={tdCls}>{fmtDate(m.date)}</td>
                    <td className={tdCls}>
                      <div>{MOVEMENT_TYPE_LABELS[m.type] || m.type}</div>
                      {(m.note || m.refNumber) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {[m.refNumber, m.note].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </td>
                    <td
                      className={`${tdCls} font-semibold ${
                        q < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-700 dark:text-green-400'
                      }`}
                    >
                      {q > 0 ? '+' : ''}
                      {fmtQty(q)}
                    </td>
                    <td className={tdCls}>{money(m.unitCost)}</td>
                    <td className={tdCls}>{money(m.value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            className={secondaryBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className={secondaryBtn}
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </Drawer>
  );
}
