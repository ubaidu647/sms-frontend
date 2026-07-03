'use client';
import React, { useMemo, useState } from 'react';
import { Table } from '@/component/Table';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  ChevronRight,
  ChevronDown,
  ListTree,
  List as ListIcon,
  MoreVertical,
  Receipt,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, deleteData } from '@/utils/api';
import toast from 'react-hot-toast';
import AccountFormModal from './AccountFormModal';
import AccountDetailModal from './AccountDetailModal';
import ConfirmModal from '../ConfirmModal';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_COLORS } from '@/constants/accounting';

const TypeBadge = ({ type }) => (
  <span
    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
      ACCOUNT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-700'
    }`}
  >
    {type}
  </span>
);

// One tree row + its descendants. Indentation scales with `level`; groups get a
// chevron toggle, leaves get a spacer so codes stay aligned.
function AccountTreeNode({
  node,
  depth,
  expanded,
  onToggle,
  onAction,
  canUpdate,
  canDelete,
  canViewLedger,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasChildren = (node.children || []).length > 0;
  const isOpen = expanded.has(node._id);

  return (
    <>
      <div
        className="group flex items-center gap-2 px-2 sm:px-3 py-2 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node._id)}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded ${
            hasChildren ? 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700' : 'invisible'
          }`}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">
          {node.code}
        </span>

        <span
          className={`text-sm text-gray-900 dark:text-gray-100 truncate ${
            node.isGroup ? 'font-semibold' : ''
          }`}
        >
          {node.name}
        </span>

        <TypeBadge type={node.type} />

        {node.isControlAccount && (
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
            Control{node.subLedgerType ? ` · ${node.subLedgerType}` : ''}
          </span>
        )}
        {node.isSystem && (
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            System
          </span>
        )}

        <div className="ml-auto relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 opacity-60 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onAction('view', node);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                {canViewLedger && !node.isGroup && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onAction('ledger', node);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Receipt className="w-4 h-4" /> Ledger
                  </button>
                )}
                {canUpdate && !node.isSystem && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onAction('edit', node);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                )}
                {canDelete && !node.isSystem && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onAction('delete', node);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isOpen &&
        hasChildren &&
        node.children.map((child) => (
          <AccountTreeNode
            key={child._id}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onAction={onAction}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canViewLedger={canViewLedger}
          />
        ))}
    </>
  );
}

export default function AccountsPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'list'
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Filters — draft holds in-progress UI values; applied drives the API.
  const [draftSearch, setDraftSearch] = useState('');
  const [draftType, setDraftType] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);

  const applyFilters = () => {
    setSearch(draftSearch);
    setType(draftType);
    setBranchId(draftBranchId);
    setPage(1);
  };
  const clearFilters = () => {
    setDraftSearch('');
    setDraftType('');
    setDraftBranchId('');
    setSearch('');
    setType('');
    setBranchId('');
    setPage(1);
  };

  const actions = user?.role?.actions || [];
  const isAdmin = !!user?.role?.isPredefined;
  const canCreate =
    isAdmin || actions.includes('create-account') || actions.includes('create-all-branch-account');
  const canUpdate =
    isAdmin || actions.includes('update-account') || actions.includes('update-all-branch-account');
  const canDelete =
    isAdmin || actions.includes('delete-account') || actions.includes('delete-all-branch-account');
  const isOrgLevel = isAdmin || actions.includes('view-all-branch-account');
  const canViewLedger =
    isAdmin || actions.includes('view-journal') || actions.includes('view-all-branch-journal');
  const userBranchId = user?.branchId || user?.branch?._id || '';
  const effectiveBranchId = isOrgLevel ? branchId : userBranchId;

  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && isOrgLevel && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  /* ------------------------------- Tree ------------------------------- */
  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['account-tree', effectiveBranchId],
    queryFn: () =>
      fetchData({
        url: '/account/tree',
        page: 1,
        limit: 1000,
        token,
        branchId: effectiveBranchId || undefined,
      }),
    enabled: !!token && !!user && viewMode === 'tree',
    placeholderData: keepPreviousData,
  });
  const tree = treeData?.data || [];

  /* ------------------------------- List ------------------------------- */
  const { data: listData } = useQuery({
    queryKey: ['account-list', page, limit, type, effectiveBranchId],
    queryFn: () => {
      const params = {};
      if (effectiveBranchId) params.branchId = effectiveBranchId;
      if (type) params.type = type;
      return fetchData({ url: '/account/list', page, limit, token, ...params });
    },
    enabled: !!token && !!user && viewMode === 'list',
    placeholderData: keepPreviousData,
  });
  const rawList = listData?.data || [];

  // Client-side name/code filter — the list endpoint paginates server-side, so
  // this narrows the current page without an extra keystroke round-trip.
  const filterFn = (a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.name?.toLowerCase().includes(q) && !String(a.code).includes(q)) return false;
    }
    if (type && a.type !== type) return false;
    return true;
  };
  const list = rawList.filter(filterFn);

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/account/${id}`, token }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Account deleted');
      queryClient.invalidateQueries({ queryKey: ['account-tree'] });
      queryClient.invalidateQueries({ queryKey: ['account-list'] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message || 'Failed to delete account'),
  });

  const toggleNode = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const expandAll = () => {
    const ids = new Set();
    const walk = (nodes) =>
      nodes.forEach((n) => {
        if ((n.children || []).length) {
          ids.add(n._id);
          walk(n.children);
        }
      });
    walk(tree);
    setExpanded(ids);
  };
  const collapseAll = () => setExpanded(new Set());

  const handleAction = (action, node) => {
    if (action === 'view') setViewTarget(node);
    if (action === 'edit') setEditTarget(node);
    if (action === 'delete') setDeleteTarget(node);
    if (action === 'ledger')
      router.push(`/dashboard/school/accounting/ledger?accountId=${node._id}`);
  };

  const columns = useMemo(
    () => [
      {
        header: 'Code',
        accessor: 'code',
        render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span>,
      },
      {
        header: 'Name',
        accessor: 'name',
        render: (v, row) => (
          <div>
            <div
              className={`text-gray-900 dark:text-gray-100 ${row.isGroup ? 'font-semibold' : ''}`}
            >
              {v}
            </div>
            {row.parent?.name && (
              <div className="text-xs text-gray-400">under {row.parent.name}</div>
            )}
          </div>
        ),
      },
      { header: 'Type', accessor: 'type', render: (v) => <TypeBadge type={v} /> },
      {
        header: 'Level',
        accessor: 'level',
        render: (v) => <span className="text-sm text-gray-600">{v}</span>,
      },
      {
        header: 'Flags',
        accessor: 'isControlAccount',
        render: (_v, row) => (
          <div className="flex flex-wrap gap-1">
            {row.isControlAccount && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-teal-100 text-teal-800">
                Control
              </span>
            )}
            {row.isSystem && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                System
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              v === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {v || 'active'}
          </span>
        ),
      },
    ],
    [],
  );
  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [{ label: 'View', value: 'view', icon: Eye }];
    if (canViewLedger && !row.isGroup)
      items.push({ label: 'Ledger', value: 'ledger', icon: Receipt });
    if (canUpdate && !row.isSystem) items.push({ label: 'Edit', value: 'edit', icon: Edit });
    if (canDelete && !row.isSystem) items.push({ label: 'Delete', value: 'delete', icon: Trash2 });
    return items;
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Chart of Accounts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your ledger account hierarchy — assets, liabilities, equity, income and expenses.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Account
            </button>
          )}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm ${
                viewMode === 'tree'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
              }`}
            >
              <ListTree className="w-4 h-4" /> Tree
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm ${
                viewMode === 'list'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300'
              }`}
            >
              <ListIcon className="w-4 h-4" /> List
            </button>
          </div>

          <div className="flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search name or code..."
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilters();
              }}
              className="outline-none text-sm w-48 text-gray-900 dark:text-gray-100 bg-transparent placeholder:text-gray-400"
            />
          </div>

          <select
            value={draftType}
            onChange={(e) => setDraftType(e.target.value)}
            className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 capitalize"
          >
            <option value="">All Types</option>
            {ACCOUNT_TYPES.map((tp) => (
              <option key={tp} value={tp} className="capitalize">
                {tp}
              </option>
            ))}
          </select>

          {isOrgLevel && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setDraftBranchId(e.target.value)}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
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

        {viewMode === 'tree' ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-end gap-3 px-3 py-2 border-b border-gray-100 dark:border-gray-800 text-xs">
              <button
                type="button"
                onClick={expandAll}
                className="text-teal-700 dark:text-teal-400 hover:underline"
              >
                Expand all
              </button>
              <button type="button" onClick={collapseAll} className="text-gray-500 hover:underline">
                Collapse all
              </button>
            </div>
            {treeLoading && !tree.length ? (
              <div className="py-16 text-center text-gray-400 text-sm">Loading accounts…</div>
            ) : tree.length ? (
              tree.map((node) => (
                <AccountTreeNode
                  key={node._id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleNode}
                  onAction={handleAction}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  canViewLedger={canViewLedger}
                />
              ))
            ) : (
              <div className="py-16 text-center text-gray-400 text-sm">
                No accounts yet. Create your first account to get started.
              </div>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={list}
            rowActions={rowActions}
            onRowAction={handleAction}
            showImage={false}
            visibleColumns={visibleColumns}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            totalItems={listData?.total}
          />
        )}

        <AccountFormModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          branchId={effectiveBranchId}
          isOrgLevel={isOrgLevel}
        />
        <AccountFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          account={editTarget}
          branchId={effectiveBranchId}
          isOrgLevel={isOrgLevel}
        />
        <AccountDetailModal
          isOpen={!!viewTarget}
          onClose={() => setViewTarget(null)}
          accountId={viewTarget?._id}
        />
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete Account"
          message={
            deleteTarget
              ? `Delete "${deleteTarget.name}" (${deleteTarget.code})? Accounts with child accounts or posted entries cannot be deleted.`
              : ''
          }
          confirmLabel="Delete"
          confirmTone="danger"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        />
      </div>
    </div>
  );
}
