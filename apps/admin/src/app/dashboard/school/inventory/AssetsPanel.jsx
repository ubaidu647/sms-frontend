'use client';
// Fixed asset register: filters, register existing asset, detail + history,
// edit / status / transfer / dispose, printable tag list.
import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Edit,
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatAmount } from '@/utils/money';
import { ASSET_ACTIVE_STATUSES, ASSET_STATUSES, refName } from '@/utils/inventory';
import { StaffSelect } from '../leave/LeavePickers';
import AssetFormModal from './AssetFormModal';
import AssetDetailModal from './AssetDetailModal';
import AssetActionModal from './AssetActionModal';
import {
  AssetStatusBadge,
  Spinner,
  cardCls,
  fmtDate,
  inputCls,
  labelCls,
  money,
  primaryBtn,
  printSheet,
  secondaryBtn,
} from './inventoryShared';

const EMPTY = { search: '', status: '', category: '', location: '', assignedTo: '' };
const COLUMNS = ['tagNumber', 'category', 'location', 'assignedToStaffId', 'cost', 'status'];

const assignedName = (a) => refName(a.assignedToStaffId, '') || refName(a.assignedTo, '');

export default function AssetsPanel({ branchId, canAsset, orgAsset }) {
  const { accessToken: token } = useTokenStore();
  const [draft, setDraft] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formAsset, setFormAsset] = useState(undefined);
  const [detailId, setDetailId] = useState(null);
  const [action, setAction] = useState(null); // { mode, asset }
  const [printing, setPrinting] = useState(false);

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branchId = branchId;
    Object.entries(filters).forEach(([k, v]) => {
      const s = String(v || '').trim();
      if (s) p[k] = s;
    });
    return p;
  }, [filters, branchId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-assets', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/inventory/assets', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const columns = [
    {
      header: 'Asset',
      accessor: 'tagNumber',
      render: (v, r) => (
        <div>
          <div className="text-sm font-mono text-gray-900 dark:text-gray-100">{v}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{r.name}</div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (v) => <span className="text-sm">{v || '—'}</span>,
    },
    {
      header: 'Location',
      accessor: 'location',
      render: (v) => <span className="text-sm">{v || '—'}</span>,
    },
    {
      header: 'Assigned to',
      accessor: 'assignedToStaffId',
      render: (_, r) => <span className="text-sm">{assignedName(r) || '—'}</span>,
    },
    {
      header: 'Cost',
      accessor: 'cost',
      render: (v, r) => (
        <div>
          <div className="text-sm">{money(v)}</div>
          <div className="text-xs text-gray-500 capitalize">{r.condition}</div>
        </div>
      ),
    },
    { header: 'Status', accessor: 'status', render: (v) => <AssetStatusBadge status={v} /> },
  ];

  const rowActions = (a) => {
    const list = [{ label: 'Details & history', value: 'view', icon: Eye }];
    if (canAsset && ASSET_ACTIVE_STATUSES.includes(a.status)) {
      list.push({ label: 'Edit', value: 'edit', icon: Edit });
      list.push({ label: 'Change status', value: 'status', icon: RefreshCw });
      list.push({ label: 'Transfer', value: 'transfer', icon: ArrowRightLeft });
      list.push({ label: 'Dispose / lost', value: 'dispose', icon: Trash2, danger: true });
    }
    return list;
  };

  const runAction = (mode, a) => {
    if (mode === 'view') return setDetailId(a._id);
    if (mode === 'edit') return setFormAsset(a);
    setAction({ mode, asset: a });
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

  const printTags = async () => {
    setPrinting(true);
    try {
      const res = await fetchData({
        url: '/inventory/assets',
        page: 1,
        limit: 1000,
        token,
        ...params,
      });
      const list = res?.data || [];
      printSheet({
        title: 'Asset tag list',
        subtitle: [
          `Printed ${new Date().toLocaleString()}`,
          filters.status ? `Status: ${filters.status}` : '',
          filters.location ? `Location: ${filters.location}` : '',
        ],
        headers: [
          'Tag',
          'Name',
          'Category',
          'Location',
          'Assigned to',
          'Purchased',
          'Cost',
          'Status',
        ],
        rows: list.map((a) => [
          a.tagNumber,
          a.name,
          a.category || '',
          a.location || '',
          assignedName(a),
          fmtDate(a.purchaseDate),
          formatAmount(a.cost),
          a.status,
        ]),
        footer: `${list.length} asset(s)`,
      });
    } catch (err) {
      toast.error(err?.message || 'Could not load assets to print');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className={labelCls}>Search</label>
            <input
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              placeholder="Tag or name…"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={draft.status}
              onChange={(e) => setInstant({ status: e.target.value })}
              className={inputCls}
            >
              <option value="">All</option>
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('-', ' ')}
                </option>
              ))}
            </select>
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
          <div>
            <label className={labelCls}>Location</label>
            <input
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && apply()}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Assigned to</label>
            <StaffSelect
              value={draft.assignedTo}
              branchId={branchId || undefined}
              placeholder="Anyone"
              onChange={(id) => setInstant({ assignedTo: id })}
            />
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
          <div className="flex flex-wrap gap-2 ml-auto">
            <button type="button" className={secondaryBtn} onClick={printTags} disabled={printing}>
              <Printer className="w-4 h-4" />
              {printing ? 'Preparing…' : 'Print tag list'}
            </button>
            {canAsset && (
              <button type="button" className={primaryBtn} onClick={() => setFormAsset(null)}>
                <Plus className="w-4 h-4" />
                Register existing asset
              </button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load assets" />
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
          onRowAction={runAction}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <AssetDetailModal
        assetId={detailId}
        canManage={canAsset}
        onClose={() => setDetailId(null)}
        onAction={(mode, a) => runAction(mode, a)}
      />
      <AssetFormModal
        isOpen={formAsset !== undefined}
        asset={formAsset || null}
        onClose={() => setFormAsset(undefined)}
        orgTier={orgAsset}
        defaultBranchId={branchId}
      />
      <AssetActionModal
        asset={action?.asset}
        mode={action?.mode}
        orgTier={orgAsset}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
