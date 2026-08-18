'use client';
import React, { useState, useMemo } from 'react';
import { Table } from '@/component/Table';
import {
  Plus,
  Search,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  LayoutGrid,
  Rows3,
  ShieldOff,
  X,
} from 'lucide-react';
import AddRoleModal from './AddRoleModal';
import RoleCard from './RoleCard';
import RoleDetailModal from './RoleDetailModal';
import EditRoleModal from './EditRoleModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { fetchData, deleteData, patchData } from '@/utils/api';
import { AVAILABLE_MENUS, AVAILABLE_ACTIONS } from '@/constants/rolePermissions';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

function twoMonthsBeforeISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString().slice(0, 10);
}

function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const toggle = (key) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  return (
    <div className="relative w-full lg:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full lg:w-auto flex items-center justify-between gap-1 bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap"
      >
        <span className="flex items-center gap-1">
          {label}
          {selected.length > 0 && (
            <span className="ml-1 bg-teal-100 text-teal-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 ml-1 text-gray-400 dark:text-gray-500" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 w-full lg:min-w-[180px] lg:w-auto max-h-56 overflow-y-auto p-1">
          {options.map((opt) => (
            <label
              key={opt.key}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.key)}
                onChange={() => toggle(opt.key)}
                className="accent-teal-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Same controls the table footer offers, for the card grid.
function Pager({ page, limit, total, onPageChange, onLimitChange }) {
  const totalPages = Math.max(Math.ceil((total || 0) / limit), 1);
  if (!total) return null;

  const numbers = [];
  const push = (n) => numbers.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
  } else if (page <= 4) {
    for (let i = 1; i <= 5; i++) push(i);
    push('...');
    push(totalPages);
  } else if (page >= totalPages - 3) {
    push(1);
    push('...');
    for (let i = totalPages - 4; i <= totalPages; i++) push(i);
  } else {
    push(1);
    push('...');
    for (let i = page - 1; i <= page + 1; i++) push(i);
    push('...');
    push(totalPages);
  }

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>
          {from}–{to} of {total}
        </span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-sm"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-gray-900 dark:text-gray-100">
        <button
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${page === 1 ? 'opacity-40' : ''}`}
        >
          Prev
        </button>
        {numbers.map((n, i) =>
          n === '...' ? (
            <span key={`gap-${i}`} className="px-2 text-gray-500 dark:text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${
                n === page ? 'bg-teal-600 text-white border-teal-600' : ''
              }`}
            >
              {n}
            </button>
          ),
        )}
        <button
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${page === totalPages ? 'opacity-40' : ''}`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const t = useTranslations('roles');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailRoleId, setDetailRoleId] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // role object to confirm-delete
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  // Cards read better for roles — a role is a profile, not a row of numbers —
  // but the table stays one click away for side-by-side comparison.
  const [view, setView] = useState('grid');

  // Filters — draft state holds what the user is typing/picking; applied state
  // is what the query runs on, so nothing hits the API until Search is pressed.
  const DEFAULT_FROM = twoMonthsBeforeISO();
  const DEFAULT_TO = new Date().toISOString().slice(0, 10);

  const [draftName, setDraftName] = useState('');
  const [draftSerialNumber, setDraftSerialNumber] = useState('');
  const [draftBranchName, setDraftBranchName] = useState('');
  const [draftBranchId, setDraftBranchId] = useState('');
  const [draftActions, setDraftActions] = useState([]);
  const [draftMenus, setDraftMenus] = useState([]);
  const [draftFromDate, setDraftFromDate] = useState(DEFAULT_FROM);
  const [draftToDate, setDraftToDate] = useState(DEFAULT_TO);
  const [draftIsActive, setDraftIsActive] = useState('');

  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [selectedActions, setSelectedActions] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [fromDate, setFromDate] = useState(DEFAULT_FROM);
  const [toDate, setToDate] = useState(DEFAULT_TO);
  const [isActive, setIsActive] = useState('');

  const applyFilters = () => {
    setName(draftName);
    setSerialNumber(draftSerialNumber);
    setBranchName(draftBranchName);
    setBranchId(draftBranchId);
    setSelectedActions(draftActions);
    setSelectedMenus(draftMenus);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setIsActive(draftIsActive);
    setPage(1);
  };

  const onFilterKeyDown = (e) => {
    if (e.key === 'Enter') applyFilters();
  };

  // Marks the Search button while a draft differs from what the list shows, so
  // it is obvious the results are still from the previous query.
  const sameList = (a, b) => a.length === b.length && a.every((v) => b.includes(v));
  const pendingChanges =
    draftName !== name ||
    draftSerialNumber !== serialNumber ||
    draftBranchName !== branchName ||
    draftBranchId !== branchId ||
    draftFromDate !== fromDate ||
    draftToDate !== toDate ||
    draftIsActive !== isActive ||
    !sameList(draftActions, selectedActions) ||
    !sameList(draftMenus, selectedMenus);

  const clearFilters = () => {
    setDraftName('');
    setDraftSerialNumber('');
    setDraftBranchName('');
    setDraftBranchId('');
    setDraftActions([]);
    setDraftMenus([]);
    setDraftFromDate(DEFAULT_FROM);
    setDraftToDate(DEFAULT_TO);
    setDraftIsActive('');

    setName('');
    setSerialNumber('');
    setBranchName('');
    setBranchId('');
    setSelectedActions([]);
    setSelectedMenus([]);
    setFromDate(DEFAULT_FROM);
    setToDate(DEFAULT_TO);
    setIsActive('');
    setPage(1);
  };

  const hasOrgAccess =
    !!user?.role?.isPredefined || !!user?.role?.actions?.includes('view-all-branch-role');

  const canDelete =
    !!user?.role?.isPredefined ||
    !!user?.role?.actions?.includes('delete-role') ||
    !!user?.role?.actions?.includes('delete-all-branch-role');

  const canActOnAllBranches =
    !!user?.role?.isPredefined || !!user?.role?.actions?.includes('delete-all-branch-role');

  const userBranchId = user?.branchId || user?.branch?._id || '';

  // Fetch branches lazily — only after user opens the branch dropdown
  const [branchDropdownTouched, setBranchDropdownTouched] = useState(false);
  const { data: branchData } = useQuery({
    queryKey: ['branches-dropdown'],
    queryFn: () => fetchData({ url: '/branch/list', page: 1, limit: 100, token }),
    enabled: !!token && hasOrgAccess && branchDropdownTouched,
    staleTime: Infinity,
  });
  const branches = branchData?.data || [];

  const columns = useMemo(
    () => [
      {
        header: 'Role Name',
        accessor: 'name',
        render: (v) => <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>,
      },
      {
        header: 'Serial No.',
        accessor: 'serialNumber',
        render: (v) => <div className="text-gray-600 dark:text-gray-400">{v}</div>,
      },
      {
        header: 'Branch',
        accessor: 'branch',
        render: (v) => <div className="text-gray-600 dark:text-gray-400">{v?.name ?? '—'}</div>,
      },
      {
        header: 'Menus',
        accessor: 'menus',
        render: (v) => (
          <div className="flex flex-wrap gap-1">
            {v?.map((m) => (
              <span
                key={m}
                className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
              >
                {m}
              </span>
            ))}
          </div>
        ),
      },
      {
        header: 'Actions Count',
        accessor: 'actions',
        render: (v) => (
          <div className="text-gray-600 dark:text-gray-400">{v?.length ?? 0} actions</div>
        ),
      },
      {
        header: 'Type',
        accessor: 'isPredefined',
        render: (v) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              v ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {v ? 'Predefined' : 'Custom'}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'isActive',
        render: (v) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              v ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {v ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        header: 'Created',
        accessor: 'createdAt',
        render: (v) => (
          <div className="text-gray-600 dark:text-gray-400">{new Date(v).toLocaleDateString()}</div>
        ),
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const rowActions = (row) => {
    const items = [
      { label: 'View Details', value: 'view', icon: Eye },
      { label: 'Edit', value: 'edit', icon: Edit },
    ];

    // Predefined roles: never show delete/toggle regardless of user permission
    if (row.isPredefined) return items;
    // No permission at all
    if (!canDelete) return items;
    // Branch-scoped permission: only show for own branch rows
    if (!canActOnAllBranches && row.branch?._id !== userBranchId) return items;

    items.push(
      row.isActive
        ? { label: 'Disable', value: 'toggle', icon: Ban }
        : { label: 'Enable', value: 'toggle', icon: CheckCircle },
    );
    items.push({ label: 'Delete', value: 'delete', icon: Trash2, danger: true });
    return items;
  };

  const toggleMutation = useMutation({
    mutationFn: (id) => patchData({ url: `/role/${id}/toggle-status`, token }),
    onSuccess: (res, id) => {
      queryClient.setQueriesData({ queryKey: ['roles'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).map((r) =>
            r._id === id ? { ...r, isActive: res.data.isActive } : r,
          ),
        };
      });
      queryClient.setQueryData(['role-detail', id], (old) =>
        old ? { ...old, isActive: res.data.isActive } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(res.message || 'Role status updated');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to toggle role status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteData({ url: `/role/${id}`, token }),
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: ['roles'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: (old.data || []).filter((r) => r._id !== id),
          total: Math.max((old.total || 1) - 1, 0),
        };
      });
      toast.success('Role deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete role');
    },
  });

  const queryKey = [
    'roles',
    page,
    limit,
    name,
    serialNumber,
    branchName,
    branchId,
    selectedActions,
    selectedMenus,
    fromDate,
    toDate,
    isActive,
    hasOrgAccess,
    userBranchId,
  ];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = {};

      if (!hasOrgAccess) {
        params.branchId = userBranchId;
      } else if (branchId) {
        params.branchId = branchId;
      }

      if (name) params.name = name;
      if (serialNumber) params.serialNumber = serialNumber;
      if (selectedActions.length) params.actions = selectedActions.join(',');
      if (selectedMenus.length) params.menus = selectedMenus.join(',');
      if (hasOrgAccess && branchName) params.branchName = branchName;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (isActive !== '') params.isActive = isActive;

      return fetchData({ url: '/role/list', page, limit, token, ...params });
    },
    placeholderData: keepPreviousData,
    enabled: !!token && !!user,
  });

  const roles = data?.data || [];

  const handleRoleAction = (action, row) => {
    if (action === 'view') setDetailRoleId(row._id);
    if (action === 'edit') setEditRole(row);
    if (action === 'toggle') toggleMutation.mutate(row._id);
    if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full md:flex-1 md:min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
              {[
                { key: 'grid', icon: LayoutGrid, label: 'Card view' },
                { key: 'table', icon: Rows3, label: 'Table view' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  title={label}
                  aria-label={label}
                  aria-pressed={view === key}
                  className={`p-1.5 rounded-md transition-colors ${
                    view === key
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add Role
            </button>
          </div>
        </div>

        {/* Filters — nothing is fetched until Search is pressed. */}
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2 sm:gap-3">
          {/* Date range — always first */}
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 gap-2 flex-wrap col-span-2 sm:col-span-3 md:col-span-2 lg:col-auto">
            <label className="text-sm text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={draftFromDate}
              onChange={(e) => setDraftFromDate(e.target.value)}
              onKeyDown={onFilterKeyDown}
              className="text-sm outline-none bg-transparent flex-1 min-w-0"
            />
            <label className="text-sm text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={draftToDate}
              onChange={(e) => setDraftToDate(e.target.value)}
              onKeyDown={onFilterKeyDown}
              className="text-sm outline-none bg-transparent flex-1 min-w-0"
            />
          </div>

          {/* Status filter */}
          <select
            value={draftIsActive}
            onChange={(e) => setDraftIsActive(e.target.value)}
            className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>

          {/* Role name search */}
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Role name..."
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={onFilterKeyDown}
              className="outline-none text-sm w-full lg:w-36 bg-transparent text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Serial number search */}
          <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Serial number..."
              value={draftSerialNumber}
              onChange={(e) => setDraftSerialNumber(e.target.value)}
              onKeyDown={onFilterKeyDown}
              className="outline-none text-sm w-full lg:w-36 bg-transparent text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Branch dropdown — org only */}
          {hasOrgAccess && (
            <select
              value={draftBranchId}
              onFocus={() => setBranchDropdownTouched(true)}
              onChange={(e) => setDraftBranchId(e.target.value)}
              className="w-full lg:w-auto bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {/* Branch name search — org only */}
          {hasOrgAccess && (
            <div className="w-full lg:w-auto flex items-center bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Branch name..."
                value={draftBranchName}
                onChange={(e) => setDraftBranchName(e.target.value)}
                onKeyDown={onFilterKeyDown}
                className="outline-none text-sm w-full lg:w-36 bg-transparent text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {/* Actions multi-select */}
          <MultiSelectDropdown
            label="Actions"
            options={AVAILABLE_ACTIONS}
            selected={draftActions}
            onChange={setDraftActions}
          />

          {/* Menus multi-select */}
          <MultiSelectDropdown
            label="Menus"
            options={AVAILABLE_MENUS}
            selected={draftMenus}
            onChange={setDraftMenus}
          />

          <button
            type="button"
            onClick={applyFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm w-full lg:w-auto"
          >
            <Search className="w-4 h-4" />
            Search
            {pendingChanges && <span className="w-1.5 h-1.5 rounded-full bg-white/90" />}
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-sm w-full lg:w-auto"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>

        {view === 'grid' ? (
          <div className="md:flex-1 md:min-h-0 md:overflow-y-auto scrollbar-hide">
            {roles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center">
                <ShieldOff className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  No roles match these filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <RoleCard
                    key={role._id}
                    role={role}
                    actions={rowActions(role)}
                    onAction={handleRoleAction}
                  />
                ))}
              </div>
            )}

            <Pager
              page={page}
              limit={limit}
              total={data?.total ?? roles.length}
              onPageChange={setPage}
              onLimitChange={(n) => {
                setLimit(n);
                setPage(1);
              }}
            />
          </div>
        ) : (
          <Table
            columns={columns}
            data={roles}
            rowActions={rowActions}
            onRowAction={handleRoleAction}
            showImage={false}
            visibleColumns={visibleColumns}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            totalItems={data?.total}
          />
        )}

        <AddRoleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
        />

        <RoleDetailModal
          isOpen={!!detailRoleId}
          onClose={() => setDetailRoleId(null)}
          roleId={detailRoleId}
        />

        <EditRoleModal
          isOpen={!!editRole}
          onClose={() => setEditRole(null)}
          onSuccess={() => setEditRole(null)}
          role={editRole}
        />

        {/* Delete confirmation dialog */}
        {deleteTarget && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-8 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete Role</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {deleteTarget.name}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(deleteTarget._id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
