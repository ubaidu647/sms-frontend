'use client';
// Purchases: list (supplier / status / date filters), new purchase, detail + void.
import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Eye } from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { creditRemainderPaisa, fromPaisa, refName, toPaisa } from '@/utils/inventory';
import PurchaseFormModal from './PurchaseFormModal';
import PurchaseDetailModal from './PurchaseDetailModal';
import {
  Spinner,
  StatusBadge,
  cardCls,
  fmtDate,
  idOf,
  inputCls,
  labelCls,
  money,
  primaryBtn,
  useSupplierOptions,
} from './inventoryShared';

const COLUMNS = ['serialNumber', 'date', 'supplierId', 'total', 'paidAmount', 'credit', 'status'];

export default function PurchasesPanel({ branchId, canPurchase, orgPurchase }) {
  const { accessToken: token } = useTokenStore();
  const [filters, setFilters] = useState({ supplierId: '', status: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState(null); // { id, initial }
  const { suppliers } = useSupplierOptions();

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branchId = branchId;
    Object.entries(filters).forEach(([k, v]) => v && (p[k] = v));
    return p;
  }, [filters, branchId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-purchases', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/inventory/purchases', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const columns = [
    {
      header: 'No.',
      accessor: 'serialNumber',
      render: (v, r) => (
        <div>
          <div className="text-sm font-mono">{v || '—'}</div>
          {r.billNumber && <div className="text-xs text-gray-500">Bill {r.billNumber}</div>}
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (v) => <span className="text-sm">{fmtDate(v)}</span>,
    },
    {
      header: 'Supplier',
      accessor: 'supplierId',
      render: (v, r) => (
        <span className="text-sm">
          {refName(v, '') ||
            refName(r.supplier, '') ||
            suppliers.find((s) => s._id === idOf(v))?.name ||
            '—'}
        </span>
      ),
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (v) => <span className="text-sm font-medium">{money(v)}</span>,
    },
    {
      header: 'Paid',
      accessor: 'paidAmount',
      render: (v) => <span className="text-sm">{money(v)}</span>,
    },
    {
      header: 'On credit',
      accessor: 'credit',
      render: (_, r) => (
        <span className="text-sm text-amber-700 dark:text-amber-400">
          {money(fromPaisa(creditRemainderPaisa(toPaisa(r.total), toPaisa(r.paidAmount))))}
        </span>
      ),
    },
    { header: 'Status', accessor: 'status', render: (v) => <StatusBadge status={v} /> },
  ];

  const setF = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className={labelCls}>Supplier</label>
            <select
              value={filters.supplierId}
              onChange={(e) => setF({ supplierId: e.target.value })}
              className={inputCls}
            >
              <option value="">All suppliers</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
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
          {canPurchase && (
            <div className="lg:text-right">
              <button type="button" className={primaryBtn} onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4" />
                New purchase
              </button>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load purchases" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={COLUMNS}
          rowActions={[{ label: 'View', value: 'view', icon: Eye }]}
          onRowAction={(_, r) => setDetail({ id: r._id })}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <PurchaseFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        orgTier={orgPurchase}
        defaultBranchId={branchId}
        onCreated={(created) => {
          const id = created?.purchase?._id || created?._id;
          if (id) setDetail({ id, initial: created });
        }}
      />
      <PurchaseDetailModal
        purchaseId={detail?.id || null}
        initial={detail?.initial}
        canManage={canPurchase}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
