'use client';
// School shop: sales to students (pending → billed on the next fee voucher),
// new sale, void a pending sale.
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Ban, Info } from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { SALE_STATUSES, refName } from '@/utils/inventory';
import ShopSaleFormModal from './ShopSaleFormModal';
import {
  ReasonModal,
  Spinner,
  StatusBadge,
  StudentSearch,
  cardCls,
  fmtDate,
  fmtQty,
  inputCls,
  invalidateInventoryShop,
  labelCls,
  lineItemName,
  money,
  primaryBtn,
} from './inventoryShared';

const COLUMNS = ['serialNumber', 'date', 'studentId', 'lines', 'total', 'status'];

const studentOf = (r) => r.studentId || r.student;

export default function ShopPanel({ branchId, canShop }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });
  const [student, setStudent] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [voidRow, setVoidRow] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branchId = branchId;
    if (student?._id) p.studentId = student._id;
    Object.entries(filters).forEach(([k, v]) => v && (p[k] = v));
    return p;
  }, [filters, branchId, student]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-sales', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/inventory/sales', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      patchData({ url: `/inventory/sales/${id}/void`, payload: { reason }, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Sale voided — stock returned');
      invalidateInventoryShop(queryClient);
      setVoidRow(null);
    },
    onError: (err) => toast.error(err.message || 'Could not void the sale'),
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
      header: 'Student',
      accessor: 'studentId',
      render: (_, r) => {
        const s = studentOf(r);
        return (
          <div>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {refName(s, '') || r.studentName || '—'}
            </div>
            {s?.admissionNumber && <div className="text-xs text-gray-500">{s.admissionNumber}</div>}
          </div>
        );
      },
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
      header: 'Total',
      accessor: 'total',
      render: (v) => <span className="text-sm font-medium">{money(v)}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (v, r) => (
        <div>
          <StatusBadge status={v} />
          {v === 'billed' && (r.voucherId?.voucherNumber || r.billedAt) && (
            <div className="text-xs text-gray-500 mt-0.5">
              {r.voucherId?.voucherNumber || fmtDate(r.billedAt)}
            </div>
          )}
        </div>
      ),
    },
  ];

  const setF = (patch) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-start p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-sm text-blue-800 dark:text-blue-300">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>
          Pending sales are added to the student&apos;s next fee voucher as a &quot;School
          shop&quot; line and become billed. Only pending sales can be voided; voiding or
          regenerating the voucher returns them to pending.
        </span>
      </div>
      <div className={cardCls}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className={labelCls}>Student</label>
            <StudentSearch
              value={student}
              branchId={branchId}
              onChange={(s) => {
                setStudent(s);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setF({ status: e.target.value })}
              className={inputCls}
            >
              <option value="">All</option>
              {SALE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
        </div>
        {canShop && (
          <div className="flex mt-3">
            <button
              type="button"
              className={`${primaryBtn} ml-auto`}
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-4 h-4" />
              New sale
            </button>
          </div>
        )}
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load shop sales" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={COLUMNS}
          rowActions={(r) =>
            canShop && r.status === 'pending'
              ? [{ label: 'Void sale', value: 'void', icon: Ban, danger: true }]
              : []
          }
          onRowAction={(action, r) => action === 'void' && setVoidRow(r)}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <ShopSaleFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} branchId={branchId} />
      <ReasonModal
        isOpen={!!voidRow}
        onClose={() => setVoidRow(null)}
        title={`Void sale ${voidRow?.serialNumber || ''}`}
        message="The items go back into stock and the sale will not be billed."
        loading={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutate({ id: voidRow._id, reason })}
      />
    </div>
  );
}
