'use client';
// Suppliers (with payable balance) + supplier payments.
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit, Ban, CheckCircle, FileText, Wallet, Search } from 'lucide-react';
import { Table } from '@/component/Table';
import { Tabs } from '@/component/Tabs';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { refName, toPaisa } from '@/utils/inventory';
import SupplierFormModal from './SupplierFormModal';
import SupplierPaymentModal from './SupplierPaymentModal';
import SupplierStatementModal from './SupplierStatementModal';
import ConfirmModal from './ConfirmModal';
import {
  ReasonModal,
  Spinner,
  StatusBadge,
  cardCls,
  fmtDate,
  inputCls,
  invalidateInventoryPurchases,
  labelCls,
  money,
  primaryBtn,
  secondaryBtn,
  useSupplierOptions,
} from './inventoryShared';

const SUPPLIER_COLUMNS = ['name', 'contactPerson', 'phone', 'balance', 'isActive'];
const PAYMENT_COLUMNS = ['serialNumber', 'date', 'supplierId', 'amount', 'method', 'status'];

function SuppliersList({ canPurchase, orgPurchase, branchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formSupplier, setFormSupplier] = useState(undefined);
  const [statement, setStatement] = useState(null);
  const [paySupplier, setPaySupplier] = useState(null);
  const [toggle, setToggle] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-suppliers', { search, page, limit }],
    queryFn: () =>
      fetchData({
        url: '/inventory/suppliers',
        page,
        limit,
        token,
        ...(search ? { search } : {}),
      }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const toggleMutation = useMutation({
    mutationFn: (s) =>
      patchData({
        url: `/inventory/suppliers/${s._id}/status`,
        payload: { isActive: s.isActive === false },
        token,
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Supplier updated');
      invalidateInventoryPurchases(queryClient);
      setToggle(null);
    },
    onError: (err) => toast.error(err.message || 'Could not update the supplier'),
  });

  const columns = [
    {
      header: 'Supplier',
      accessor: 'name',
      render: (v, r) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{v}</div>
          {r.email && <div className="text-xs text-gray-500">{r.email}</div>}
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'contactPerson',
      render: (v) => <span className="text-sm">{v || '—'}</span>,
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (v) => <span className="text-sm">{v || '—'}</span>,
    },
    {
      header: 'Balance (payable)',
      accessor: 'balance',
      render: (v) => (
        <span
          className={`text-sm font-semibold ${
            toPaisa(v) > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500'
          }`}
        >
          {money(v)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (v) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
            v === false
              ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          }`}
        >
          {v === false ? 'Inactive' : 'Active'}
        </span>
      ),
    },
  ];

  const rowActions = (s) => {
    const list = [{ label: 'Statement', value: 'statement', icon: FileText }];
    if (canPurchase) {
      if (toPaisa(s.balance) > 0)
        list.push({ label: 'Record payment', value: 'pay', icon: Wallet });
      list.push({ label: 'Edit', value: 'edit', icon: Edit });
      list.push(
        s.isActive === false
          ? { label: 'Activate', value: 'toggle', icon: CheckCircle }
          : { label: 'Deactivate', value: 'toggle', icon: Ban, danger: true },
      );
    }
    return list;
  };

  const apply = () => {
    setSearch(draft.trim());
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelCls}>Search</label>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              placeholder="Name, phone or contact…"
              className={inputCls}
            />
          </div>
          <button type="button" className={secondaryBtn} onClick={apply}>
            <Search className="w-4 h-4" />
            Search
          </button>
          {canPurchase && (
            <button
              type="button"
              className={`${primaryBtn} ml-auto`}
              onClick={() => setFormSupplier(null)}
            >
              <Plus className="w-4 h-4" />
              Add supplier
            </button>
          )}
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load suppliers" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={SUPPLIER_COLUMNS}
          rowActions={rowActions}
          onRowAction={(action, s) => {
            if (action === 'statement') setStatement(s);
            if (action === 'pay') setPaySupplier(s);
            if (action === 'edit') setFormSupplier(s);
            if (action === 'toggle') setToggle(s);
          }}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <SupplierFormModal
        isOpen={formSupplier !== undefined}
        supplier={formSupplier || null}
        onClose={() => setFormSupplier(undefined)}
      />
      <SupplierStatementModal supplier={statement} onClose={() => setStatement(null)} />
      <SupplierPaymentModal
        supplier={paySupplier}
        onClose={() => setPaySupplier(null)}
        orgTier={orgPurchase}
        defaultBranchId={branchId}
      />
      {toggle && (
        <ConfirmModal
          isOpen
          onClose={() => setToggle(null)}
          title={toggle.isActive === false ? 'Activate supplier' : 'Deactivate supplier'}
          message={
            toggle.isActive === false
              ? `Allow new purchases from "${toggle.name}" again?`
              : `Stop new purchases from "${toggle.name}"? Its history and balance are kept.`
          }
          confirmLabel={toggle.isActive === false ? 'Activate' : 'Deactivate'}
          confirmTone={toggle.isActive === false ? 'primary' : 'danger'}
          loading={toggleMutation.isPending}
          onConfirm={() => toggleMutation.mutate(toggle)}
        />
      )}
    </div>
  );
}

function PaymentsList({ canPurchase, branchId }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const { suppliers } = useSupplierOptions();
  const [filters, setFilters] = useState({ supplierId: '', status: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [voidRow, setVoidRow] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branchId = branchId;
    Object.entries(filters).forEach(([k, v]) => v && (p[k] = v));
    return p;
  }, [filters, branchId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-supplier-payments', { ...params, page, limit }],
    queryFn: () =>
      fetchData({ url: '/inventory/supplier-payments', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      patchData({ url: `/inventory/supplier-payments/${id}/void`, payload: { reason }, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Payment voided');
      invalidateInventoryPurchases(queryClient);
      setVoidRow(null);
    },
    onError: (err) => toast.error(err.message || 'Could not void the payment'),
  });

  const columns = [
    {
      header: 'No.',
      accessor: 'serialNumber',
      render: (v, r) => (
        <div>
          <div className="text-sm font-mono">{v || '—'}</div>
          {r.reference && <div className="text-xs text-gray-500">{r.reference}</div>}
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
            suppliers.find((s) => s._id === String(v))?.name ||
            '—'}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (v) => <span className="text-sm font-medium">{money(v)}</span>,
    },
    {
      header: 'Method',
      accessor: 'method',
      render: (v) => <span className="text-sm capitalize">{v || '—'}</span>,
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
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
        </div>
      </div>
      {error ? (
        <QueryErrorState error={error} fallback="Could not load supplier payments" />
      ) : isLoading ? (
        <div className={`${cardCls} p-12 flex justify-center`}>
          <Spinner />
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          visibleColumns={PAYMENT_COLUMNS}
          rowActions={(r) =>
            canPurchase && r.status !== 'void'
              ? [{ label: 'Void', value: 'void', icon: Ban, danger: true }]
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
      <ReasonModal
        isOpen={!!voidRow}
        onClose={() => setVoidRow(null)}
        title={`Void payment ${voidRow?.serialNumber || ''}`}
        message="The amount is added back to the supplier balance and the ledger entry is reversed."
        loading={voidMutation.isPending}
        onConfirm={(reason) => voidMutation.mutate({ id: voidRow._id, reason })}
      />
    </div>
  );
}

export default function SuppliersPanel(props) {
  const [view, setView] = useState('suppliers');
  return (
    <div>
      <Tabs
        tabs={[
          { value: 'suppliers', label: 'Suppliers' },
          { value: 'payments', label: 'Payments' },
        ]}
        activeTab={view}
        onTabChange={setView}
      />
      {view === 'suppliers' ? <SuppliersList {...props} /> : <PaymentsList {...props} />}
    </div>
  );
}
