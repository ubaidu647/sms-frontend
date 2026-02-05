import React, { useState, useMemo } from 'react';
import { MoreVertical, Eye, Edit, Package, CreditCard, Ban, Trash2 } from 'lucide-react';

export const Table = ({
  columns,
  data,
  onRowAction,
  showImage = false,
  imageAccessor = 'image',
  visibleColumns = [],
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  // Pagination States
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const visibleColumnsArray = visibleColumns.length > 0 ? visibleColumns : [];
  const filteredColumns = columns.filter((col) => visibleColumnsArray.includes(col.accessor));
  // Calculate total pages
  const totalPages = Math.ceil(data.length / limit);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * limit;
    return data.slice(start, start + limit);
  }, [data, page, limit]);

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
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const toggleMenu = (_id) => {
    setOpenMenuId(openMenuId === _id ? null : _id);
  };

  const handleAction = (action, row) => {
    setOpenMenuId(null);
    if (onRowAction) onRowAction(action, row);
  };

  const actions = [
    { label: 'View Details', value: 'view', icon: Eye },
    { label: 'Edit', value: 'edit', icon: Edit },
    { label: 'View Package', value: 'package', icon: Package },
    { label: 'View Subscription', value: 'subscription', icon: CreditCard },
    { label: 'Disable', value: 'disable', icon: Ban },
    { label: 'Delete', value: 'delete', icon: Trash2, danger: true },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        {/* ================= TABLE ================= */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                #
              </th>

              {showImage && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Logo
                </th>
              )}

              {filteredColumns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {column.header}
                </th>
              ))}

              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={filteredColumns.length + (showImage ? 2 : 1)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowNumber = (page - 1) * limit + rowIndex + 1;
                return (
                  <tr key={row._id || rowIndex} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium w-12">
                      {rowNumber}
                    </td>

                    {showImage && (
                      <td className="px-6 py-4">
                        <div className="h-12 w-12">
                          {row[imageAccessor] ? (
                            <img
                              className="h-12 w-12 rounded-lg object-cover border border-gray-200"
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

                    <td className="px-6 py-4 whitespace-nowrap text-right relative">
                      <button
                        onClick={() => toggleMenu(row._id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>

                      {openMenuId === row._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1">
                              {actions.map((action) => {
                                const Icon = action.icon;
                                return (
                                  <button
                                    key={action.value}
                                    onClick={() => handleAction(action.value, row)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                                      action.danger
                                        ? 'text-red-700 hover:bg-red-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <Icon className="w-4 h-4" />
                                    {action.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
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
          <span className="text-gray-600 text-sm">Items per page:</span>

          <select
            value={limit}
            onChange={handleLimitChange}
            className="text-black border px-2 py-1 rounded text-sm"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Page Navigation */}
        <div className="text-black flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className={`px-3 py-1 border rounded text-sm ${page === 1 ? 'opacity-40' : ''}`}
          >
            Prev
          </button>

          {getPageNumbers().map((num, idx) =>
            num === '...' ? (
              <span key={idx} className="px-3 py-1 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => setPage(num)}
                className={`px-3 py-1 border rounded text-sm ${
                  num === page ? 'bg-teal-600 text-white' : ''
                }`}
              >
                {num}
              </button>
            ),
          )}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className={`px-3 py-1 border rounded text-sm ${page === totalPages ? 'opacity-40' : ''}`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
