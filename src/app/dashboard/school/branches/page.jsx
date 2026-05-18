'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table } from '@/component/Table';
import { Plus, Search, Building2, Eye, LayoutGrid, X } from 'lucide-react';
import AddBranchModal from './AddBranchModal';
import { useTokenStore } from '@/store/tokenStore';
import { useUserStore } from '@/store/userStore';
import { useQuery } from '@tanstack/react-query';
import { fetchData } from '@/utils/api';
import { useTranslations } from 'next-intl';

function twoMonthsBeforeISO() {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString().slice(0, 10);
}

export default function BranchesPage() {
  const router = useRouter();
  const { accessToken: token } = useTokenStore();
  const { user } = useUserStore();
  const t = useTranslations('branches');
  const isAdmin = !!user?.role?.isPredefined;
  const actions = user?.role?.actions || [];
  const canViewAllProfiles =
    isAdmin ||
    actions.includes('view-all-branch-profile') ||
    actions.includes('view-branch');
  const canCreateBranch = isAdmin || actions.includes('create-branch');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const defaultFromDate = twoMonthsBeforeISO();
  const defaultToDate = new Date().toISOString().slice(0, 10);
  const [draftSearch, setDraftSearch] = useState('');
  const [draftFromDate, setDraftFromDate] = useState(defaultFromDate);
  const [draftToDate, setDraftToDate] = useState(defaultToDate);
  const [draftStatusFilter, setDraftStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const applyFilters = () => {
    setSearch(draftSearch);
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    setStatusFilter(draftStatusFilter);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftSearch('');
    setDraftFromDate(defaultFromDate);
    setDraftToDate(defaultToDate);
    setDraftStatusFilter('');
    setSearch('');
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setStatusFilter('');
    setPage(1);
  };

  const columns = useMemo(
    () => [
      {
        header: 'Branch Name',
        accessor: 'name',
        render: (v) => <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>,
      },
      {
        header: 'Code',
        accessor: 'serialNumber',
        render: (v) => <div className="text-gray-600 dark:text-gray-400">{v}</div>,
      },
      {
        header: 'Address',
        accessor: 'address',
        render: (v) => <div className="text-gray-600 dark:text-gray-400">{v}</div>,
      },
      {
        header: 'Phone',
        accessor: 'phone',
        render: (v) => <div className="text-gray-600 dark:text-gray-400">{v}</div>,
      },
      {
        header: 'Email',
        accessor: 'email',
        render: (v) => <div className="text-gray-600 dark:text-gray-400">{v}</div>,
      },
      {
        header: 'Created Date',
        accessor: 'createdAt',
        render: (v) => <div className="text-gray-600 dark:text-gray-400">{new Date(v).toLocaleDateString()}</div>,
      },
      {
        header: 'Status',
        accessor: 'status',
        render: (v) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              v === 'active'
                ? 'bg-green-100 text-green-800'
                : v === 'inactive'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {v?.charAt(0).toUpperCase() + v?.slice(1)}
          </span>
        ),
      },
    ],
    [],
  );

  const visibleColumns = useMemo(() => columns.map((c) => c.accessor), [columns]);

  const queryKey = ['branches', page, limit, search, fromDate, toDate, statusFilter];

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const columnFiltersOr = search ? { name: search } : undefined;
      const columnFilters = statusFilter ? { status: statusFilter } : undefined;
      const res = await fetchData({
        url: '/branch/list',
        page,
        limit,
        columnFilters,
        columnFiltersOr,
        token,
        from: fromDate,
        to: toDate,
      });
      return res;
    },
    keepPreviousData: true,
    enabled: !!token,
  });

  const branches = data?.data || [];

  const handleAddBranchSuccess = (newBranch) => {
    // optionally refetch or update cache
  };

  const handleRowAction = (action, row) => {
    if (action === 'profile') router.push(`/dashboard/school/branches/${row._id}/profile`);
    if (action === 'view') router.push(`/dashboard/school/branches/${row._id}/profile`);
  };

  const rowActions = [
    { label: 'Profile / Branding', value: 'profile', icon: Building2 },
    { label: 'View Details', value: 'view', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/dashboard/school/branches/profile"
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Building2 className="w-5 h-5" />
              My Branch Profile
            </Link>
            {canViewAllProfiles && (
              <Link
                href="/dashboard/school/branches/profiles"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <LayoutGrid className="w-5 h-5" />
                All Profiles
              </Link>
            )}
            {canCreateBranch && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Add Branch
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Search branches..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                className="outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 bg-transparent"
              />
              <button
                type="button"
                onClick={applyFilters}
                title="Search"
                className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">From</label>
              <input
                type="date"
                value={draftFromDate}
                onChange={(e) => setDraftFromDate(e.target.value)}
                className="outline-none text-sm text-gray-900 dark:text-gray-100 bg-transparent"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">To</label>
              <input
                type="date"
                value={draftToDate}
                onChange={(e) => setDraftToDate(e.target.value)}
                className="outline-none text-sm text-gray-900 dark:text-gray-100 bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={draftStatusFilter}
              onChange={(e) => setDraftStatusFilter(e.target.value)}
              className="bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="disabled">Disabled</option>
            </select>
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
        </div>

        <Table
          columns={columns}
          data={branches}
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

        <AddBranchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleAddBranchSuccess}
        />
      </div>
    </div>
  );
}
