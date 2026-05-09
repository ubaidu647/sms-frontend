'use client';
import React, { useState, useEffect } from 'react';
import { FilterBar } from '@/component/FilterBar';
import { Table } from '@/component/Table';
import { Tabs } from '@/component/Tabs';
import { Plus } from 'lucide-react';
import { ColumnSelector } from '@/component/ColumnSelector';
import { AddOrganizationModal } from '@/component/AddOrganizationModal';
import { useTokenStore } from '@/store/tokenStore';
import { useOrganizations } from './hooks/useOrganization';
import { useOrganizationStore } from './store/organizationStore';

const mockDisabledOrganizations = [
  {
    id: 16,
    name: 'Old Academy',
    image: '',
    email: 'contact@oldacademy.com',
    phone: '+1 234 567 8905',
    packageName: 'Basic',
    createdAt: '2023-12-01',
    status: 'disabled',
  },
];

export default function organization() {
  const { accessToken: token } = useTokenStore();
  const { data, isLoading } = useOrganizations({ token });
  const mockOrganizations = useOrganizationStore((state) => state.organizations);
  const [activeTab, setActiveTab] = useState('active');
  const [filters, setFilters] = useState({
    organizationName: '',
    createdAt: '',
    packageName: '',
    status: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const tabs = [
    { label: 'Active Organizations', value: 'active', count: mockOrganizations.length },
    { label: 'Disabled/Deleted', value: 'disabled', count: mockDisabledOrganizations.length },
  ];

  const columns = [
    {
      header: 'Organization Name',
      accessor: 'name',
      render: (value) => <div className="font-medium text-gray-900 dark:text-gray-100">{value}</div>,
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
        <div className="text-gray-600 dark:text-gray-400">{new Date(value).toLocaleDateString()}</div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => {
        const colorMap = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-yellow-100 text-yellow-800',
          disabled: 'bg-red-100 text-red-800',
        };
        return (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${colorMap[value]}`}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
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
        console.log('Disable organization:', row);
        break;
      case 'delete':
        console.log('Delete organization:', row);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setSelectedColumns(columns.map((col) => col.accessor));
  }, []);
  // const handleAddOrganizationSuccess = (newOrganization) => {
  //   setTableData((prev) => [
  //     {
  //       ...newOrganization,
  //       createdAt: new Date().toISOString().split('T')[0],
  //     },
  //     ...prev,
  //   ]);
  // };

  const filterData = (data) => {
    return data.filter((item) => {
      const matchesName =
        !filters.organizationName ||
        item.name.toLowerCase().includes(filters.organizationName.toLowerCase());
      const matchesDate = !filters.createdAt || item.createdAt === filters.createdAt;
      const matchesPackage =
        !filters.packageName ||
        item.packageName.toLowerCase() === filters.packageName.toLowerCase();
      const matchesStatus = !filters.status || item.status === filters.status;

      return matchesName && matchesDate && matchesPackage && matchesStatus;
    });
  };

  const currentData =
    activeTab === 'active' ? filterData(mockOrganizations) : filterData(mockDisabledOrganizations);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-6 rounded-[50px]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Organizations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all your organizations</p>
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
          showImage={true}
          imageAccessor="image"
          visibleColumns={selectedColumns}
        />
        <AddOrganizationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          token={token} // <-- pass the token here
          // onSuccess={handleAddOrganizationSuccess}
        />
      </div>
    </div>
  );
}
