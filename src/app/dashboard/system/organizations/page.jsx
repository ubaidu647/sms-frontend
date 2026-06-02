'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { FilterBar } from '@/component/FilterBar';
import { Table } from '@/component/Table';
import { Tabs } from '@/component/Tabs';
import { Plus, Eye, Edit, Package, CreditCard, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import { ColumnSelector } from '@/component/ColumnSelector';
import { AddOrganizationModal } from '@/component/AddOrganizationModal';
import { useTokenStore } from '@/store/tokenStore';
import { useOrganizations, useToggleSchoolStatus } from './hooks/useOrganization';
import { useOrganizationStore } from './store/organizationStore';
import { useTranslations } from 'next-intl';
import ConfirmModal from './ConfirmModal';

export default function Organization() {
  const { accessToken: token } = useTokenStore();
  useOrganizations({ token });
  const t = useTranslations('organizations');
  const organizations = useOrganizationStore((state) => state.organizations);
  const disabledOrganizations = useOrganizationStore((state) => state.disabledOrganizations);
  const [activeTab, setActiveTab] = useState('active');
  const [filters, setFilters] = useState({
    organizationName: '',
    createdAt: '',
    packageName: '',
    status: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [disableTarget, setDisableTarget] = useState(null);
  const [enableTarget, setEnableTarget] = useState(null);

  const toggleStatus = useToggleSchoolStatus();

  const tabs = [
    { label: 'Active Organizations', value: 'active', count: organizations.length },
    { label: 'Disabled/Deleted', value: 'disabled', count: disabledOrganizations.length },
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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      organizationName: '',
      createdAt: '',
      packageName: '',
      status: '',
    });
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

  const filterData = (data) => {
    return data.filter((item) => {
      const matchesName =
        !filters.organizationName ||
        item.name?.toLowerCase().includes(filters.organizationName.toLowerCase());
      const matchesDate = !filters.createdAt || item.createdAt === filters.createdAt;
      const matchesPackage =
        !filters.packageName ||
        item.packageName?.toLowerCase() === filters.packageName.toLowerCase();
      const matchesStatus = !filters.status || item.status === filters.status;

      return matchesName && matchesDate && matchesPackage && matchesStatus;
    });
  };

  const currentData =
    activeTab === 'active' ? filterData(organizations) : filterData(disabledOrganizations);

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

        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

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
        />
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
