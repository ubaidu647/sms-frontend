import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Eye, Edit, Package, CreditCard, Ban, Trash2 } from 'lucide-react';

export const Table = ({
  columns,
  data,
  onRowAction,
  showImage = false,
  imageAccessor = 'image',
  visibleColumns = [],
  rowActions, // optional — overrides the default action list
  // controlled pagination (optional)
  page: controlledPage,
  limit: controlledLimit,
  onPageChange,
  onLimitChange,
  totalItems, // if provided, assume server returns paginated data
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);

  // Pagination States (uncontrolled fallback)
  const [internalLimit, setInternalLimit] = useState(controlledLimit ?? 10);
  const [internalPage, setInternalPage] = useState(controlledPage ?? 1);
  const limit = controlledLimit ?? internalLimit;
  const page = controlledPage ?? internalPage;

  useEffect(() => {
    if (controlledLimit !== undefined) setInternalLimit(controlledLimit);
  }, [controlledLimit]);

  useEffect(() => {
    if (controlledPage !== undefined) setInternalPage(controlledPage);
  }, [controlledPage]);

  const visibleColumnsArray = visibleColumns.length > 0 ? visibleColumns : [];
  const filteredColumns = columns.filter((col) => visibleColumnsArray.includes(col.accessor));

  // Calculate total pages
  const totalPages = Math.ceil((totalItems !== undefined ? totalItems : data.length) / limit) || 1;

  // Paginated data
  const paginatedData = useMemo(() => {
    if (totalItems !== undefined) {
      // assume server returned already-paginated data
      return data;
    }
    const start = (page - 1) * limit;
    return data.slice(start, start + limit);
  }, [data, page, limit, totalItems]);

  // Page number generator
  const getPageNumbers = () => {
    let pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 3) {
      pages = [1, 2, 3, 4, '...', totalPages];
    } else if (page >= totalPages - 2) {
      pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
    }

    return pages;
  };

  const handleLimitChange = (e) => {
    const v = Number(e.target.value);
    if (onLimitChange) onLimitChange(v);
    else setInternalLimit(v);
    if (onPageChange) onPageChange(1);
    else setInternalPage(1);
  };

  const handleAction = (action, row) => {
    setOpenMenuId(null);
    if (onRowAction) onRowAction(action, row);
  };

  const defaultActions = [
    { label: 'View Details', value: 'view', icon: Eye },
    { label: 'Edit', value: 'edit', icon: Edit },
    { label: 'View Package', value: 'package', icon: Package },
    { label: 'View Subscription', value: 'subscription', icon: CreditCard },
    { label: 'Disable', value: 'disable', icon: Ban },
    { label: 'Delete', value: 'delete', icon: Trash2, danger: true },
  ];
  // rowActions can be an array (same for every row) or a function (row) => array
  const resolveActions = (row) =>
    typeof rowActions === 'function' ? rowActions(row) : (rowActions ?? defaultActions);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
      <div className="overflow-auto scrollbar-hide max-h-[calc(100vh-280px)]">
        {/* ================= TABLE ================= */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">
                #
              </th>

              {showImage && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Logo
                </th>
              )}

              {filteredColumns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                >
                  {column.header}
                </th>
              ))}

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={filteredColumns.length + (showImage ? 2 : 1)}
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowNumber = (page - 1) * limit + rowIndex + 1;
                return (
                  <tr
                    key={row._id || rowIndex}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium w-12">
                      {rowNumber}
                    </td>

                    {showImage && (
                      <td className="px-6 py-4">
                        <div className="h-12 w-12">
                          {row[imageAccessor] ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                              src={row[imageAccessor]}
                              alt={row.name || 'Logo'}
                              onError={(e) => {
                                e.target.src =
                                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23f3f4f6"/%3E%3Ctext x="24" y="24" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="20" font-weight="600"%3E' +
                                  (row.name?.[0]?.toUpperCase() || '?') +
                                  '%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                              {row.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {filteredColumns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                        {column.render
                          ? column.render(row[column.accessor], row)
                          : row[column.accessor]}
                      </td>
                    ))}

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setAnchorRect({
                            top: rect.top + window.scrollY,
                            left: rect.left + window.scrollX,
                            right: rect.right + window.scrollX,
                            bottom: rect.bottom + window.scrollY,
                          });
                          setOpenMenuId(openMenuId === row._id ? null : row._id);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>

                      {openMenuId === row._id &&
                        anchorRect &&
                        typeof document !== 'undefined' &&
                        createPortal(
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div
                              className="absolute z-50 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-900 ring-1 ring-black/5 dark:ring-white/10"
                              style={{
                                top: Math.min(
                                  anchorRect.bottom + 8,
                                  window.scrollY + window.innerHeight - 8 - 200,
                                ),
                                left: Math.max(anchorRect.right - 224, 8),
                              }}
                            >
                              <div className="py-1">
                                {resolveActions(row).map((action) => {
                                  const Icon = action.icon;
                                  return (
                                    <button
                                      key={action.value}
                                      onClick={() => handleAction(action.value, row)}
                                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                        action.danger
                                          ? 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      <Icon className="w-4 h-4" />
                                      {action.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>,
                          document.body,
                        )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex items-center justify-between p-4">
        {/* Items Per Page */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400 text-sm">Items per page:</span>

          <select
            value={limit}
            onChange={handleLimitChange}
            className="text-black dark:text-gray-100 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-sm"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Page Navigation */}
        <div className="text-black dark:text-gray-100 flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => (onPageChange ? onPageChange(page - 1) : setInternalPage(page - 1))}
            className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${page === 1 ? 'opacity-40' : ''}`}
          >
            Prev
          </button>

          {getPageNumbers().map((num, idx) =>
            num === '...' ? (
              <span key={idx} className="px-3 py-1 text-gray-500 dark:text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => (onPageChange ? onPageChange(num) : setInternalPage(num))}
                className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${
                  num === page ? 'bg-teal-600 text-white border-teal-600' : ''
                }`}
              >
                {num}
              </button>
            ),
          )}

          <button
            disabled={page === totalPages}
            onClick={() => (onPageChange ? onPageChange(page + 1) : setInternalPage(page + 1))}
            className={`px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm ${page === totalPages ? 'opacity-40' : ''}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
