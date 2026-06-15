'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Edit, Trash2, Search, X } from 'lucide-react';
import { Table } from '@/component/Table';
import { Tabs } from '@/component/Tabs';
import { ColumnSelector } from '@/component/ColumnSelector';
import ConfirmModal from '../organizations/ConfirmModal';
import PackageFormModal from './PackageFormModal';
import PackageDetailModal from './PackageDetailModal';
import { usePackages, useDeletePackage } from './hooks/usePackages';
import { fmtMoney } from './format';

const PAGE_SIZE = 20;

export default function PackagesPage() {
  const [activeTab, setActiveTab] = useState('active'); // active | inactive
  const [page, setPage] = useState(1);

  // Draft = what's typed; applied = what actually drives the query. The query key
  // only changes on Search/Clear so we never refetch on every keystroke.
  const [draftSearch, setDraftSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [formTarget, setFormTarget] = useState(undefined); // undefined=closed, null=create, pkg=edit
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);

  const isActive = activeTab === 'active';
  const { data, isLoading, isFetching } = usePackages({
    page,
    limit: PAGE_SIZE,
    filters: { search: appliedSearch || undefined, isActive },
  });

  const packages = data?.data ?? [];
  const total = data?.total ?? packages.length;

  const deleteMutation = useDeletePackage();

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessor: 'name',
        render: (v) => <div className="font-medium text-gray-900 dark:text-gray-100">{v}</div>,
      },
      {
        header: 'Price',
        accessor: 'price',
        render: (v) => <span className="text-gray-700 dark:text-gray-300">{fmtMoney(v)}</span>,
      },
      {
        header: 'Duration',
        accessor: 'durationInDays',
        render: (v) => <span className="text-gray-600 dark:text-gray-400">{v} days</span>,
      },
      {
        header: 'Students',
        accessor: 'limits',
        render: (v) => (
          <span className="text-gray-600 dark:text-gray-400">{v?.noOfStudents ?? '-'}</span>
        ),
      },
      {
        header: 'Platforms',
        accessor: 'platforms',
        render: (v) => {
          const on = Object.entries(v || {})
            .filter(([, e]) => e)
            .map(([k]) => k);
          return (
            <span className="text-gray-600 dark:text-gray-400 capitalize">
              {on.length ? on.join(', ') : 'None'}
            </span>
          );
        },
      },
      {
        header: 'Features',
        accessor: 'features',
        render: (v) => (
          <span className="text-gray-600 dark:text-gray-400">
            {v?.length ? `${v.length} feature${v.length > 1 ? 's' : ''}` : 'All'}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'isActive',
        render: (v) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              v
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {v ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    [],
  );

  useEffect(() => {
    setSelectedColumns(columns.map((c) => c.accessor));
  }, [columns]);

  // Reset to first page whenever the result set changes shape.
  useEffect(() => {
    setPage(1);
  }, [activeTab, appliedSearch]);

  const applySearch = () => setAppliedSearch(draftSearch.trim());
  const clearSearch = () => {
    setDraftSearch('');
    setAppliedSearch('');
  };

  const rowActions = useMemo(
    () => (row) => {
      const base = [
        { label: 'View Details', value: 'view', icon: Eye },
        { label: 'Edit', value: 'edit', icon: Edit },
      ];
      if (row.isActive) {
        base.push({ label: 'Deactivate', value: 'delete', icon: Trash2, danger: true });
      }
      return base;
    },
    [],
  );

  const handleRowAction = (action, row) => {
    if (action === 'view') setDetailTarget(row);
    else if (action === 'edit') setFormTarget(row);
    else if (action === 'delete') setDeleteTarget(row);
  };

  return (
    <div className="md:flex-1 md:min-h-0 md:overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-800 p-3 sm:p-6 rounded-2xl sm:rounded-[50px]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Packages
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Define and manage subscription plans available to schools.
            </p>
          </div>
          <button
            onClick={() => setFormTarget(null)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Package
          </button>
        </div>

        <Tabs
          tabs={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search packages by name..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              onClick={applySearch}
              className="flex items-center justify-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {appliedSearch && (
              <button
                onClick={clearSearch}
                className="flex items-center justify-center gap-2 px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex justify-end items-center gap-4">
          <ColumnSelector
            columns={columns}
            selectedColumns={selectedColumns}
            onColumnToggle={(accessor) =>
              setSelectedColumns((prev) =>
                prev.includes(accessor) ? prev.filter((c) => c !== accessor) : [...prev, accessor],
              )
            }
            onSelectAll={() => setSelectedColumns(columns.map((c) => c.accessor))}
            onDeselectAll={() => setSelectedColumns([])}
          />
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            Loading packages…
          </div>
        ) : packages.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            No {isActive ? 'active' : 'inactive'} packages
            {appliedSearch ? ` matching “${appliedSearch}”` : ''}.
          </div>
        ) : (
          <Table
            columns={columns}
            data={packages}
            onRowAction={handleRowAction}
            rowActions={rowActions}
            visibleColumns={selectedColumns}
            page={page}
            limit={PAGE_SIZE}
            totalItems={total}
            onPageChange={setPage}
          />
        )}
        {isFetching && !isLoading && (
          <p className="mt-2 text-xs text-gray-400 text-right">Updating…</p>
        )}

        <PackageFormModal
          isOpen={formTarget !== undefined}
          onClose={() => setFormTarget(undefined)}
          pkg={formTarget || null}
        />

        <PackageDetailModal
          isOpen={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          pkg={detailTarget}
        />

        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Deactivate Package"
          message={
            deleteTarget
              ? `Deactivate “${deleteTarget.name}”? It will be hidden from new assignments. Existing schools keep their current subscription.`
              : ''
          }
          confirmLabel="Deactivate"
          confirmTone="danger"
          loading={deleteMutation.isPending}
          onConfirm={() =>
            deleteMutation.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) })
          }
        />
      </div>
    </div>
  );
}
