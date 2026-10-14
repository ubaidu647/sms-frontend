'use client';
// Stock issues: list (filters) + new issue + detail + void.
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Eye, Ban } from 'lucide-react';
import { Table } from '@/component/Table';
import { Modal } from '@/component/Modal';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { refName } from '@/utils/inventory';
import IssueFormModal from './IssueFormModal';
import {
  ReasonModal,
  Spinner,
  StatusBadge,
  cardCls,
  fmtDate,
  fmtQty,
  inputCls,
  lineItemName,
  invalidateInventoryStock,
  labelCls,
  money,
  primaryBtn,
  tdCls,
  thCls,
} from './inventoryShared';

const COLUMNS = ['serialNumber', 'date', 'issuedTo', 'lines', 'total', 'status'];

export default function IssuePanel({ branchId, canManageInv, orgInv }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [voidRow, setVoidRow] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branchId = branchId;
    Object.entries(filters).forEach(([k, v]) => v && (p[k] = v));
    return p;
  }, [filters, branchId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-issues', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/inventory/issues', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      patchData({ url: `/inventory/issues/${id}/void`, payload: { reason }, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Issue voided — stock returned');
      invalidateInventoryStock(queryClient);
      setVoidRow(null);
    },
    onError: (err) => toast.error(err.message || 'Could not void the issue'),
  });

  const columns = [
    {
      header: 'No.',
      accessor: 'serialNumber',
      render: (v) => <span className="text-sm font-mono">{v || '—'}</span>,
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (v) => <span className="text-sm">{fmtDate(v)}</span>,
    },
    {
      header: 'Issued to',
      accessor: 'issuedTo',
      render: (v) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">
            {v?.name || refName(v?.staffId)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{v?.type}</div>
        </div>
      ),
    },
    {
      header: 'Items',
      accessor: 'lines',
      render: (v) => (
        <span className="text-sm">
          {(v || [])
            .slice(0, 3)
            .map((l) => `${lineItemName(l)} × ${fmtQty(l.quantity)}`)
            .join(', ')}
          {(v || []).length > 3 ? ` +${v.length - 3}` : ''}
        </span>
      ),
    },
    {
      header: 'Value',
      accessor: 'total',
      render: (v) => <span className="text-sm font-medium">{money(v)}</span>,
    },
    { header: 'Status', accessor: 'status', render: (v) => <StatusBadge status={v} /> },
  ];

  const rowActions = (r) => {
    const list = [{ label: 'View', value: 'view', icon: Eye }];
    if (canManageInv && r.status === 'posted')
      list.push({ label: 'Void', value: 'void', icon: Ban, danger: true });
    return list;
  };

  const setF = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setF({ status: e.target.value })}
              className={inputCls}
            >
              <option value="">All</option>
              <option value="posted">Posted</option>
              <option value="void">Void</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setF({ from: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setF({ to: e.target.value })}
              className={inputCls}
            />
          </div>
          {canManageInv && (
            <div className="sm:text-right">
              <button type="button" className={primaryBtn} onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4" />
                New issue
              </button>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load stock issues" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={COLUMNS}
          rowActions={rowActions}
          onRowAction={(action, r) => {
            if (action === 'view') setDetail(r);
            if (action === 'void') setVoidRow(r);
          }}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <IssueFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        orgTier={orgInv}
        defaultBranchId={branchId}
      />
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={`Issue ${detail?.serialNumber || ''}`}
        subtitle={detail ? `${fmtDate(detail.date)} · ${detail.issuedTo?.name || ''}` : ''}
      >
        {detail && (
          <div className="space-y-3">
            <StatusBadge status={detail.status} />
            {detail.voidReason && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Void reason: {detail.voidReason}
              </p>
            )}
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className={thCls}>Item</th>
                  <th className={thCls}>Qty</th>
                  <th className={thCls}>Unit cost</th>
                  <th className={thCls}>Value</th>
                </tr>
              </thead>
              <tbody>
                {(detail.lines || []).map((l, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td className={tdCls}>{lineItemName(l)}</td>
                    <td className={tdCls}>{fmtQty(l.quantity)}</td>
                    <td className={tdCls}>{money(l.unitCost)}</td>
                    <td className={tdCls}>{money(l.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm font-semibold text-right text-gray-900 dark:text-gray-100">
              Total {money(detail.total)}
            </p>
          </div>
        )}
      </Modal>
      <ReasonModal
        isOpen={!!voidRow}
        onClose={() => setVoidRow(null)}
        title={`Void issue ${voidRow?.serialNumber || ''}`}
        message="The issued quantities go back into stock and the expense entry is reversed."
        loading={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutate({ id: voidRow._id, reason })}
      />
    </div>
  );
}
