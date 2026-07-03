'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import {
  Plus,
  Search,
  Eye,
  Ban,
  X,
  BookUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  FileText,
} from 'lucide-react';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import JournalFormModal from './JournalFormModal';
import JournalDetailModal from './JournalDetailModal';
import VoidJournalModal from './VoidJournalModal';
import VoucherFormModal from './VoucherFormModal';
import {
  JOURNAL_SOURCES,
  JOURNAL_STATUSES,
  JOURNAL_SOURCE_COLORS,
  JOURNAL_STATUS_COLORS,
  VOUCHER_TYPES,
  VOUCHER_TYPE_LABELS,
  VOUCHER_TYPE_COLORS,
  formatDate,
  formatMoney,
} from '@/constants/accounting';

export default function JournalsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();

  const [formMode, setFormMode] = useState(null); // 'manual' | 'opening-balance' | null
  const [voucherKind, setVoucherKind] = useState(null); // 'payment' | 'receipt' | 'contra' | null
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters — draft holds in-progress values; applied drives the API.
  const [draftFrom, setDraftFrom] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [draftSource, setDraftSource] = useState('');
  const [draftVoucherType, setDraftVoucherType] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [source, setSource] = useState('');
  const [voucherType, setVoucherType] = useState('');
  const [status, setStatus] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const applyFilters = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setSource(draftSource);
    setVoucherType(draftVoucherType);
    setStatus(draftStatus);
    setBranchId(draftBranchId);
    setPage(1);
  };
  const clearFilters = () => {
    setDraftFrom('');
    setDraftTo('');
    setDraftSource('');
    setDraftVoucherType('');
    setDraftStatus('');
    setDraftBranchId('');
    setFrom('');
    setTo('');
    setSource('');
    setVoucherType('');
    setStatus('');
    setBranchId('');
    setPage(1);
  };

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canCreate =
    isAdmin || actions.includes('create-journal') || actions.includes('create-all-branch-journal');
  const canVoid =
    isAdmin || actions.includes('void-journal') || actions.includes('void-all-branch-journal');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-journal');
  const userBranchId = user?.branchId || user?.branch?._id || '';
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const { data } = useQuery({
    queryKey: [
      'journal-list',
      page,
      limit,
      from,
      to,
      source,
      voucherType,
      status,
      effectiveBranchId,
    ],
    queryFn: () => {
      const params = {};
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      if (from) params.from = from;
      if (to) params.to = to;
      if (source) params.source = source;
      if (voucherType) params.voucherType = voucherType;
      if (status) params.status = status;
      return fetchData({ url: '/ledger/journal/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });
  const list = data?.data || [];

  const columns = useMemo(
    () => [
      {
        header: 'Entry',
        accessor: 'serialNumber',
        render: (v, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>
            <div className="text-xs text-gray-400 max-w-[220px] truncate">{row.narration}</div>
          </div>
        ),
      },
      {
        header: 'Type',
        accessor: 'voucherType',
        render: (v) =>
          v ? (
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                VOUCHER_TYPE_COLORS[v] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {VOUCHER_TYPE_LABELS[v] || v}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
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
        header: 'Source',
        accessor: 'source',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              JOURNAL_SOURCE_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {v}
          </span>
        ),
      },
      {
        header: 'Branch',
        accessor: 'branch',
        render: (v, row) => (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {v?.name || row.branchId?.name || '—'}
          </span>
        ),
      },
      {
        header: 'Amount',
        accessor: 'totalDebit',
        render: (v) => (
          <span className="text-sm font-medium text-teal-700 dark:text-teal-400">
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
              JOURNAL_STATUS_COLORS[v] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {v}
          </span>
        ),
      },
    ],
    [],
  );
  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View', value: 'view', icon: Eye }];
    // Only manual entries can be voided here; auto-posted entries reverse via their source.
    if (
      canVoid &&
      row.status === 'posted' &&
      (row.source === 'manual' || row.source === 'opening-balance')
    )
      items.push({ label: 'Void', value: 'void', icon: Ban });
    return items;
  };

  const handleRowAction = (action, row) => {
    if (action === 'view') setDetailId(row._id);
    if (action === 'void') setVoidTarget(row);
  };

  const inputWrap =
    'bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 outline-none';

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Journal Entries
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Every posting in the ledger — manual entries, opening balances and auto-posted
              fee/salary transactions.
            </p>
          </div>
          {canCreate && (
            <div className="relative self-start">
              <button
                onClick={() => setCreateMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                New
                <ChevronDown className="w-4 h-4" />
              </button>
              {createMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCreateMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 text-sm">
                    {[
                      {
                        label: 'Payment Voucher',
                        hint: 'Money out',
                        icon: ArrowUpRight,
                        run: () => setVoucherKind('payment'),
                      },
                      {
                        label: 'Receipt Voucher',
                        hint: 'Money in',
                        icon: ArrowDownLeft,
                        run: () => setVoucherKind('receipt'),
                      },
                      {
                        label: 'Contra Voucher',
                        hint: 'Cash ↔ Bank',
                        icon: Repeat,
                        run: () => setVoucherKind('contra'),
                      },
                      {
                        label: 'Journal Entry',
                        hint: 'Manual',
                        icon: FileText,
                        run: () => setFormMode('manual'),
                      },
                      {
                        label: 'Opening Balance',
                        hint: '',
                        icon: BookUp,
                        run: () => setFormMode('opening-balance'),
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            setCreateMenuOpen(false);
                            opt.run();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Icon className="w-4 h-4 text-teal-600" />
                          <span className="flex-1 text-left">{opt.label}</span>
                          {opt.hint && <span className="text-xs text-gray-400">{opt.hint}</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2 sm:gap-3">
          <input
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
            className={inputWrap}
            title="From date"
          />
          <input
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
            className={inputWrap}
            title="To date"
          />
          <select
            value={draftSource}
            onChange={(e) => setDraftSource(e.target.value)}
            className={inputWrap}
          >
            <option value="">All Sources</option>
            {JOURNAL_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={draftVoucherType}
            onChange={(e) => setDraftVoucherType(e.target.value)}
            className={inputWrap}
          >
            <option value="">All Voucher Types</option>
            {VOUCHER_TYPES.map((vt) => (
              <option key={vt} value={vt}>
                {VOUCHER_TYPE_LABELS[vt]}
              </option>
            ))}
          </select>
          <select
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
            className={inputWrap}
          >
            <option value="">All Statuses</option>
            {JOURNAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {isOrgLevel && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setDraftBranchId(e.target.value)}
              className={inputWrap}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={applyFilters}
            className="flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        <Table
          columns={columns}
          data={list}
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

        <JournalFormModal
          isOpen={!!formMode}
          onClose={() => setFormMode(null)}
          mode={formMode || 'manual'}
          branchId={effectiveBranchId}
          isOrgLevel={isOrgLevel}
        />
        <VoucherFormModal
          isOpen={!!voucherKind}
          onClose={() => setVoucherKind(null)}
          kind={voucherKind || 'payment'}
          branchId={effectiveBranchId}
          isOrgLevel={isOrgLevel}
        />
        <JournalDetailModal
          isOpen={!!detailId}
          onClose={() => setDetailId(null)}
          journalId={detailId}
        />
        <VoidJournalModal
          isOpen={!!voidTarget}
          onClose={() => setVoidTarget(null)}
          journal={voidTarget}
        />
      </div>
    </div>
  );
}
