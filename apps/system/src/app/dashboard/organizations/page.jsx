'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FilterBar } from '@/component/FilterBar';
import { Table } from '@/component/Table';
import { Tabs } from '@/component/Tabs';
import { Plus, Eye, Edit, Package, CreditCard, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import { ColumnSelector } from '@/component/ColumnSelector';
import { AddOrganizationModal } from '@/component/AddOrganizationModal';
import { useTokenStore } from '@/store/tokenStore';
import { useOrganizations, useToggleSchoolStatus } from './hooks/useOrganization';
import { useTranslations } from 'next-intl';
import ConfirmModal from './ConfirmModal';

const EMPTY_FILTERS = { organizationName: '', createdAt: '', status: '' };
const SEARCH_DEBOUNCE_MS = 400;

export default function Organization() {
  const { accessToken: token } = useTokenStore();
  const t = useTranslations('organizations');
  const [activeTab, setActiveTab] = useState('active');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  // `filters` is what the inputs show; `appliedSearch` is the debounced name
  // search that actually drives the query (no request per keystroke).
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedSearch, setAppliedSearch] = useState('');
  const searchTimer = useRef(null);
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  const { data, isLoading, isFetching } = useOrganizations({
    token,
    page,
    limit,
    tab: activeTab,
    search: appliedSearch,
    status: filters.status,
    createdOn: filters.createdAt,
  });
  const currentData = data?.data ?? [];
  const total = data?.total ?? 0;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [disableTarget, setDisableTarget] = useState(null);
  const [enableTarget, setEnableTarget] = useState(null);

  const toggleStatus = useToggleSchoolStatus();

  // Only the open tab's total is known (one request per view).
  const tabs = [
    {
      label: 'Active Organizations',
      value: 'active',
      count: activeTab === 'active' && data ? total : undefined,
    },
    {
      label: 'Disabled/Deleted',
      value: 'disabled',
      count: activeTab === 'disabled' && data ? total : undefined,
    },
  ];

  const columns = [
    {
      header: 'Organization Name',
      accessor: 'name',
      render: (value) => (
        <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => <div className="text-gray-600 dark:text-gray-400">{value}</div>,
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (value) => <div className="text-gray-600 dark:text-gray-400">{value}</div>,
    },
    {
      header: 'Package',
      accessor: 'packageName',
      render: (value) => {
        const colorMap = {
          Enterprise: 'bg-orange-100 text-orange-800',
          Premium: 'bg-blue-100 text-blue-800',
          Standard: 'bg-green-100 text-green-800',
          Basic: 'bg-gray-100 text-gray-800',
        };
        return (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${colorMap[value] || 'bg-gray-100 text-gray-800'}`}
          >
            {value}
          </span>
        );
      },
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      render: (value) => (
        <div className="text-gray-600 dark:text-gray-400">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (_value, row) => {
        const isRowDisabled = row?.isActive === false || row?.status === 'suspended';
        const label = isRowDisabled ? 'Disabled' : row?.status || 'Active';
        const colorMap = {
          active: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          suspended: 'bg-red-100 text-red-800',
        };
        const key = isRowDisabled ? 'suspended' : row?.status || 'active';
        return (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${colorMap[key] || 'bg-gray-100 text-gray-800'}`}
          >
            {label.charAt(0).toUpperCase() + label.slice(1)}
          </span>
        );
      },
    },
  ];

  // Every change that reshapes the result set resets to page 1 in the same
  // update, so a stale page number never fires its own request.
  const handleFilterChange = (newFilters) => {
    const searchChanged = newFilters.organizationName !== filters.organizationName;
    setFilters(newFilters);
    if (searchChanged) {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        setAppliedSearch(newFilters.organizationName.trim());
        setPage(1);
      }, SEARCH_DEBOUNCE_MS);
    } else {
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    clearTimeout(searchTimer.current);
    setFilters(EMPTY_FILTERS);
    setAppliedSearch('');
    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value) || 20);
    setPage(1);
  };

  const handleColumnToggle = (accessor) => {
    setSelectedColumns((prev) => {
      if (prev.includes(accessor)) {
        return prev.filter((col) => col !== accessor);
      } else {
        return [...prev, accessor];
      }
    });
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(columns.map((col) => col.accessor));
  };

  const handleDeselectAllColumns = () => {
    setSelectedColumns([]);
  };

  const handleRowAction = (action, row) => {
    switch (action) {
      case 'view':
        console.log('View details:', row);
        break;
      case 'edit':
        console.log('Edit organization:', row);
        break;
      case 'package':
        console.log('View package:', row);
        break;
      case 'subscription':
        console.log('View subscription:', row);
        break;
      case 'disable':
        setDisableTarget(row);
        break;
      case 'enable':
        setEnableTarget(row);
        break;
      case 'delete':
        console.log('Delete organization:', row);
        break;
      default:
        break;
    }
  };

  const rowActions = useMemo(
    () => (row) => {
      const isRowDisabled = row?.isActive === false || row?.status === 'suspended';
      const base = [
        { label: 'View Details', value: 'view', icon: Eye },
        { label: 'Edit', value: 'edit', icon: Edit },
        { label: 'View Package', value: 'package', icon: Package },
        { label: 'View Subscription', value: 'subscription', icon: CreditCard },
      ];
      const toggle = isRowDisabled
        ? { label: 'Enable', value: 'enable', icon: CheckCircle2 }
        : { label: 'Disable', value: 'disable', icon: Ban };
      return [...base, toggle, { label: 'Delete', value: 'delete', icon: Trash2, danger: true }];
    },
    [],
  );

  useEffect(() => {
    setSelectedColumns(columns.map((col) => col.accessor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Organization
          </button>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          searchPlaceholder="Search organizations..."
        />

        <div className="mb-4 flex justify-end items-center gap-4">
          <ColumnSelector
            columns={columns}
            selectedColumns={selectedColumns}
            onColumnToggle={handleColumnToggle}
            onSelectAll={handleSelectAllColumns}
            onDeselectAll={handleDeselectAllColumns}
          />
        </div>

        <Table
          columns={columns}
          data={currentData}
          onRowAction={handleRowAction}
          rowActions={rowActions}
          showImage={true}
          imageAccessor="image"
          visibleColumns={selectedColumns}
          page={page}
          limit={limit}
          totalItems={total}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
        {isLoading && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading organizations…</p>
        )}
        {isFetching && !isLoading && (
          <p className="mt-2 text-xs text-gray-400 text-right">Updating…</p>
        )}
        <AddOrganizationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          token={token}
        />

        <ConfirmModal
          isOpen={!!disableTarget}
          onClose={() => setDisableTarget(null)}
          title="Disable School"
          message={
            disableTarget
              ? `Are you sure you want to disable "${disableTarget.name}"? All users of this school will be logged out immediately and will not be able to log back in until it is re-enabled.`
              : ''
          }
          confirmLabel="Disable"
          confirmTone="danger"
          loading={toggleStatus.isPending}
          onConfirm={() =>
            toggleStatus.mutate(
              { id: disableTarget._id, isActive: false },
              { onSuccess: () => setDisableTarget(null) },
            )
          }
        />

        <ConfirmModal
          isOpen={!!enableTarget}
          onClose={() => setEnableTarget(null)}
          title="Enable School"
          message={
            enableTarget
              ? `Re-enable "${enableTarget.name}"? Users will be able to log in again.`
              : ''
          }
          confirmLabel="Enable"
          confirmTone="primary"
          loading={toggleStatus.isPending}
          onConfirm={() =>
            toggleStatus.mutate(
              { id: enableTarget._id, isActive: true },
              { onSuccess: () => setEnableTarget(null) },
            )
          }
        />
      </div>
    </div>
  );
}
