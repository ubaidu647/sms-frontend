'use client';
// Catalogue: search / category / availability filters; add, edit,
// activate/deactivate titles; open a title to manage its copies.
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit, Ban, CheckCircle, Search, X } from 'lucide-react';
import { Table } from '@/component/Table';
import QueryErrorState from '@/component/QueryErrorState';
import { fetchData, patchData } from '@/utils/api';
import { canActInBranch } from '@/utils/permissions';
import { useTokenStore } from '@/store/tokenStore';
import BookFormModal from './BookFormModal';
import BookDetailModal from './BookDetailModal';
import ConfirmModal from './ConfirmModal';
import {
  Spinner,
  cardCls,
  inputCls,
  invalidateLibraryCatalogue,
  labelCls,
  primaryBtn,
  secondaryBtn,
} from './libraryShared';

const EMPTY = { search: '', category: '', available: '' };
const COLUMNS = ['title', 'category', 'isbn', 'shelf', 'copies', 'isActive'];

export default function CataloguePanel({ role, userBranchId, branchId, orgTier, canManageAny }) {
  const { accessToken: token } = useTokenStore();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(EMPTY);
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [formBook, setFormBook] = useState(undefined); // undefined closed, null create, obj edit
  const [detailId, setDetailId] = useState(null);
  const [toggleBook, setToggleBook] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (branchId) p.branchId = branchId;
    if (filters.search.trim()) p.search = filters.search.trim();
    if (filters.category.trim()) p.category = filters.category.trim();
    if (filters.available) p.available = filters.available;
    return p;
  }, [filters, branchId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['library-books', { ...params, page, limit }],
    queryFn: () => fetchData({ url: '/library/books', page, limit, token, ...params }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data || [];
  const total = data?.total ?? rows.length;

  const toggleMutation = useMutation({
    mutationFn: (b) =>
      patchData({
        url: `/library/books/${b._id}/status`,
        payload: { isActive: b.isActive === false },
        token,
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Book updated');
      invalidateLibraryCatalogue(queryClient);
      setToggleBook(null);
    },
    onError: (err) => toast.error(err.message || 'Could not update the book'),
  });

  const canManageRow = (b) => canActInBranch(role, 'manage-library', userBranchId, b.branchId);

  const columns = [
    {
      header: 'Title',
      accessor: 'title',
      render: (v, r) => (
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{v}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {Array.isArray(r.authors) ? r.authors.join(', ') : r.authors}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (v) => <span className="text-sm">{v || '—'}</span>,
    },
    {
      header: 'ISBN',
      accessor: 'isbn',
      render: (v) => <span className="text-sm font-mono">{v || '—'}</span>,
    },
    {
      header: 'Shelf',
      accessor: 'shelf',
      render: (v) => <span className="text-sm">{v || '—'}</span>,
    },
    {
      header: 'Available / Total',
      accessor: 'copies',
      render: (_, r) => {
        const avail = Number(r.copiesAvailable) || 0;
        return (
          <span
            className={`text-sm font-semibold ${
              avail > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-500'
            }`}
          >
            {avail} / {Number(r.copiesTotal) || 0}
          </span>
        );
      },
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

  const rowActions = (b) => {
    const items = [{ label: 'Copies & details', value: 'view', icon: Eye }];
    if (canManageRow(b)) {
      items.push({ label: 'Edit', value: 'edit', icon: Edit });
      items.push(
        b.isActive === false
          ? { label: 'Activate', value: 'toggle', icon: CheckCircle }
          : { label: 'Deactivate', value: 'toggle', icon: Ban, danger: true },
      );
    }
    return items;
  };

  const apply = () => {
    setFilters(draft);
    setPage(1);
  };
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY);
  const detailBook = rows.find((b) => b._id === detailId);

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
                placeholder="Title, author or ISBN…"
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
          <div>
            <label className={labelCls}>Availability</label>
            <select
              value={draft.available}
              onChange={(e) => {
                const next = { ...draft, available: e.target.value };
                setDraft(next);
                setFilters(next);
                setPage(1);
              }}
              className={inputCls}
            >
              <option value="">All titles</option>
              <option value="true">Copies on shelf</option>
            </select>
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
          {canManageAny && (
            <button
              type="button"
              className={`${primaryBtn} ml-auto`}
              onClick={() => setFormBook(null)}
            >
              <Plus className="w-4 h-4" />
              Add book
            </button>
          )}
        </div>
      </div>

      {error ? (
        <QueryErrorState error={error} fallback="Could not load the catalogue" />
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
          onRowAction={(action, b) => {
            if (action === 'view') setDetailId(b._id);
            if (action === 'edit') setFormBook(b);
            if (action === 'toggle') setToggleBook(b);
          }}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          totalItems={total}
          maxVisibleRows={10}
        />
      )}

      <BookFormModal
        isOpen={formBook !== undefined}
        book={formBook || null}
        onClose={() => setFormBook(undefined)}
        orgTier={orgTier}
        defaultBranchId={branchId}
      />
      <BookDetailModal
        bookId={detailId}
        onClose={() => setDetailId(null)}
        canManage={detailBook ? canManageRow(detailBook) : false}
      />
      {toggleBook && (
        <ConfirmModal
          isOpen
          onClose={() => setToggleBook(null)}
          title={toggleBook.isActive === false ? 'Activate book' : 'Deactivate book'}
          message={
            toggleBook.isActive === false
              ? `Make "${toggleBook.title}" available in the catalogue again?`
              : `Hide "${toggleBook.title}" from the catalogue? Its copies can no longer be issued.`
          }
          confirmLabel={toggleBook.isActive === false ? 'Activate' : 'Deactivate'}
          confirmTone={toggleBook.isActive === false ? 'primary' : 'danger'}
          loading={toggleMutation.isPending}
          onConfirm={() => toggleMutation.mutate(toggleBook)}
        />
      )}
    </div>
  );
}
