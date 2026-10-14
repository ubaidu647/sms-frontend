'use client';
// Items & stock: catalogue with the branch's quantity / average cost / value,
// add & edit items, movements drawer, stock adjustment and branch transfer.
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Ban,
  CheckCircle,
  History,
  Search,
  X,
  SlidersHorizontal,
  ArrowRightLeft,
} from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { itemStock } from '@/utils/inventory';
import ItemFormModal from './ItemFormModal';
import ItemMovementsDrawer from './ItemMovementsDrawer';
import AdjustmentModal from './AdjustmentModal';
import TransferModal from './TransferModal';
import ConfirmModal from './ConfirmModal';
import {
  LowStockBadge,
  Spinner,
  cardCls,
  fmtQty,
  inputCls,
  invalidateInventoryStock,
  labelCls,
  money,
  primaryBtn,
  secondaryBtn,
} from './inventoryShared';

const EMPTY = { search: '', category: '', lowStock: '', saleable: '' };
const COLUMNS = ['name', 'category', 'quantity', 'avgCost', 'value', 'salePrice', 'isActive'];

export default function ItemsPanel({ branchId, canManageInv, orgInv }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formItem, setFormItem] = useState(undefined); // undefined closed, null create
  const [movesItem, setMovesItem] = useState(null);
  const [toggleItem, setToggleItem] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branchId = branchId;
    if (filters.search.trim()) p.search = filters.search.trim();
    if (filters.category.trim()) p.category = filters.category.trim();
    if (filters.lowStock) p.lowStock = true;
    if (filters.saleable) p.saleable = true;
    return p;
  }, [filters, branchId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-items', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/inventory/items', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const toggleMutation = useMutation({
    mutationFn: (it) =>
      patchData({
        url: `/inventory/items/${it._id}/status`,
        payload: { isActive: it.isActive === false },
        token,
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Item updated');
      invalidateInventoryStock(queryClient);
      setToggleItem(null);
    },
    onError: (err) => toast.error(err.message || 'Could not update the item'),
  });

  const columns = [
    {
      header: 'Item',
      accessor: 'name',
      render: (v, r) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{v}</span>
            {itemStock(r).lowStock && <LowStockBadge />}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{r.sku || '—'}</div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (v) => <span className="text-sm">{v || '—'}</span>,
    },
    {
      header: branchId || !orgInv ? 'In stock' : 'In stock (all branches)',
      accessor: 'quantity',
      render: (_, r) => {
        const st = itemStock(r);
        return (
          <div>
            <span
              className={`text-sm font-semibold ${
                st.lowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {fmtQty(st.quantity)} {r.unit || ''}
            </span>
            {Number(r.reorderLevel) > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Reorder at {fmtQty(r.reorderLevel)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Avg cost',
      accessor: 'avgCost',
      render: (_, r) => <span className="text-sm">{money(itemStock(r).avgCost)}</span>,
    },
    {
      header: 'Value',
      accessor: 'value',
      render: (_, r) => <span className="text-sm font-medium">{money(itemStock(r).value)}</span>,
    },
    {
      header: 'Sale price',
      accessor: 'salePrice',
      render: (v, r) => (
        <span className="text-sm">
          {r.isSaleable ? money(v) : <span className="text-gray-400">—</span>}
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

  const rowActions = (it) => {
    const list = [{ label: 'Movements', value: 'moves', icon: History }];
    if (canManageInv) {
      list.push({ label: 'Edit', value: 'edit', icon: Edit });
      list.push(
        it.isActive === false
          ? { label: 'Activate', value: 'toggle', icon: CheckCircle }
          : { label: 'Deactivate', value: 'toggle', icon: Ban, danger: true },
      );
    }
    return list;
  };

  const apply = () => {
    setFilters(draft);
    setPage(1);
  };
  const setInstant = (patch) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setFilters(next);
    setPage(1);
  };
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className={labelCls}>Search</label>
            <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                value={draft.search}
                onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
                placeholder="Name or SKU…"
                className="outline-none text-sm w-full bg-transparent text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              className={inputCls}
            />
          </div>
          <div className="flex flex-wrap gap-4 pb-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={!!draft.lowStock}
                onChange={(e) => setInstant({ lowStock: e.target.checked ? 'true' : '' })}
              />
              Low stock
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={!!draft.saleable}
                onChange={(e) => setInstant({ saleable: e.target.checked ? 'true' : '' })}
              />
              Shop items
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button type="button" className={secondaryBtn} onClick={apply}>
            <Search className="w-4 h-4" />
            Search
          </button>
          {hasFilters && (
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                setDraft(EMPTY);
                setFilters(EMPTY);
                setPage(1);
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </button>
          )}
          {canManageInv && (
            <div className="flex flex-wrap gap-2 ml-auto">
              <button type="button" className={secondaryBtn} onClick={() => setAdjustOpen(true)}>
                <SlidersHorizontal className="w-4 h-4" />
                Stock adjustment
              </button>
              {orgInv && (
                <button
                  type="button"
                  className={secondaryBtn}
                  onClick={() => setTransferOpen(true)}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Branch transfer
                </button>
              )}
              <button type="button" className={primaryBtn} onClick={() => setFormItem(null)}>
                <Plus className="w-4 h-4" />
                Add item
              </button>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load items" />
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
          onRowAction={(action, it) => {
            if (action === 'moves') setMovesItem(it);
            if (action === 'edit') setFormItem(it);
            if (action === 'toggle') setToggleItem(it);
          }}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <ItemFormModal
        isOpen={formItem !== undefined}
        item={formItem || null}
        onClose={() => setFormItem(undefined)}
      />
      <ItemMovementsDrawer
        item={movesItem}
        branchId={branchId}
        onClose={() => setMovesItem(null)}
      />
      <AdjustmentModal
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        orgTier={orgInv}
        defaultBranchId={branchId}
      />
      {orgInv && (
        <TransferModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
          defaultBranchId={branchId}
        />
      )}
      {toggleItem && (
        <ConfirmModal
          isOpen
          onClose={() => setToggleItem(null)}
          title={toggleItem.isActive === false ? 'Activate item' : 'Deactivate item'}
          message={
            toggleItem.isActive === false
              ? `Make "${toggleItem.name}" available again?`
              : `Hide "${toggleItem.name}" from purchases, issues and the shop? Its stock history is kept.`
          }
          confirmLabel={toggleItem.isActive === false ? 'Activate' : 'Deactivate'}
          confirmTone={toggleItem.isActive === false ? 'primary' : 'danger'}
          loading={toggleMutation.isPending}
          onConfirm={() => toggleMutation.mutate(toggleItem)}
        />
      )}
    </div>
  );
}
