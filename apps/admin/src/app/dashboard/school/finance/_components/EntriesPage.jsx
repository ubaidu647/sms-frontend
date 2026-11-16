'use client';
import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search, X, Pencil, Ban, Paperclip } from 'lucide-react';
import { Table } from '@/component/Table';
import { fetchData } from '@/utils/api';
import { useTokenStore } from '@/store/tokenStore';
import { formatDate, formatMoney } from '@/constants/accounting';
import { startOfMonthYMD } from '@/utils/localDate';
import {
  KIND_COPY,
  filterCls,
  useBranches,
  useCategories,
  useFinanceAccess,
} from './financeShared';
import EntryFormModal from './EntryFormModal';
import VoidEntryModal from './VoidEntryModal';

/** The list screen shared by Expenses and Other Income. */
export default function EntriesPage({ kind = 'expense' }) {
  const copy = KIND_COPY[kind];
  const { accessToken: token } = useTokenStore();
  const { user, canManage, isOrgLevel, userBranchId } = useFinanceAccess();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [draft, setDraft] = useState({
    from: startOfMonthYMD(),
    to: '',
    accountId: '',
    status: '',
    search: '',
    branchId: '',
  });
  const [applied, setApplied] = useState(draft);
  const [branchTouched, setBranchTouched] = useState(false);

  const setField = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const apply = () => {
    setApplied(draft);
    setPage(1);
  };
  const clear = () => {
    const empty = { from: '', to: '', accountId: '', status: '', search: '', branchId: '' };
    setDraft(empty);
    setApplied(empty);
    setPage(1);
  };

  const effectiveBranchId = isOrgLevel ? applied.branchId : userBranchId;
  const branches = useBranches(isOrgLevel && branchTouched);
  const categories = useCategories(kind, effectiveBranchId, !!user);

  const { data } = useQuery({
    queryKey: ['finance-entries', kind, page, limit, applied, effectiveBranchId],
    queryFn: () => {
      const params = { kind };
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      for (const k of ['from', 'to', 'accountId', 'status', 'search'])
        if (applied[k]) params[k] = applied[k];
      return fetchData({ url: '/finance/entries', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });
  const rows = data?.data || [];

  const columns = useMemo(
    () => [
      {
        header: 'Entry',
        accessor: 'serialNumber',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
              {v}
              {row.receipt?.url && <Paperclip className="w-3.5 h-3.5 text-gray-400" />}
            </div>
            {row.note && (
              <div className="text-xs text-gray-400 max-w-[220px] truncate">{row.note}</div>
            )}
          </div>
        ),
      },
      {
        header: 'Date',
        accessor: 'date',
        render: (v) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(v)}</span>
        ),
      },
      {
        header: 'Category',
        accessor: 'accountName',
        render: (v) => <span className="text-sm text-gray-800 dark:text-gray-200">{v || '—'}</span>,
      },
      {
        header: copy.partyLabel,
        accessor: 'party',
        render: (v) => <span className="text-sm text-gray-600 dark:text-gray-400">{v || '—'}</span>,
      },
      {
        header: copy.moneyLabel,
        accessor: 'cashBankAccountName',
        render: (v) => <span className="text-sm text-gray-600 dark:text-gray-400">{v || '—'}</span>,
      },
      {
        header: 'Amount',
        accessor: 'amount',
        render: (v, row) => (
          <span
            className={`text-sm font-medium ${
              row.status === 'void' ? 'line-through text-gray-400' : copy.amountColor
            }`}
          >
            {formatMoney(v)}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              v === 'void'
                ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                : 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
            }`}
          >
            {v === 'void' ? 'Void' : 'Recorded'}
          </span>
        ),
      },
    ],
    [copy],
  );
  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [];
    if (row.receipt?.url) items.push({ label: 'View receipt', value: 'receipt', icon: Paperclip });
    if (canManage && row.status === 'posted') {
      items.push({ label: 'Edit', value: 'edit', icon: Pencil });
      items.push({ label: 'Void', value: 'void', icon: Ban });
    }
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'receipt') window.open(row.receipt.url, '_blank', 'noopener,noreferrer');
    if (action === 'edit') setEditTarget(row);
    if (action === 'void') setVoidTarget(row);
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {copy.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{copy.subtitle}</p>
          </div>
          {canManage && (
            <button
              onClick={() => setFormOpen(true)}
              className={`self-start flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors shadow-sm ${copy.accent} ${copy.accentHover}`}
            >
              <Plus className="w-5 h-5" />
              New {copy.singular}
            </button>
          )}
        </div>

        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2 sm:gap-3">
          <input
            type="date"
            value={draft.from}
            onChange={setField('from')}
            className={filterCls}
            title="From date"
          />
          <input
            type="date"
            value={draft.to}
            onChange={setField('to')}
            className={filterCls}
            title="To date"
          />
          <select value={draft.accountId} onChange={setField('accountId')} className={filterCls}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select value={draft.status} onChange={setField('status')} className={filterCls}>
            <option value="">Recorded &amp; void</option>
            <option value="posted">Recorded only</option>
            <option value="void">Void only</option>
          </select>
          {isOrgLevel && (
            <select
              value={draft.branchId}
              onFocus={() => setBranchTouched(true)}
              onChange={setField('branchId')}
              className={filterCls}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={draft.search}
            onChange={setField('search')}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="Search no., party, note"
            className={filterCls}
          />
          <button
            type="button"
            onClick={apply}
            className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        <div className="mb-4 inline-flex items-baseline gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total (recorded)</span>
          <span className={`text-lg font-semibold ${copy.amountColor}`}>
            {formatMoney(data?.custom?.totalAmount || 0)}
          </span>
        </div>

        <Table
          columns={columns}
          data={rows}
          rowActions={rowActions}
          onRowAction={handleRowAction}
          showImage={false}
          visibleColumns={visibleColumns}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={data?.total}
        />

        <EntryFormModal
          isOpen={formOpen || !!editTarget}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          kind={kind}
          entry={editTarget}
          branchId={effectiveBranchId}
        />
        <VoidEntryModal
          isOpen={!!voidTarget}
          onClose={() => setVoidTarget(null)}
          entry={voidTarget}
        />
      </div>
    </div>
  );
}
