import React from 'react';
import { ChevronDown } from 'lucide-react';

export const ColumnSelector = ({
  columns,
  selectedColumns,
  onColumnToggle,
  onSelectAll,
  onDeselectAll,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const allSelected = selectedColumns.length === columns.length;
  const someSelected = selectedColumns.length > 0 && selectedColumns.length < columns.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
      >
        <span>Columns</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-20">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={handleSelectAll}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {}}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = someSelected;
                    }
                  }}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  {allSelected ? 'Deselect All' : 'Select All'}
                </span>
              </button>
            </div>

            <div className="p-2 max-h-64 overflow-y-auto">
              {columns.map((column) => (
                <label
                  key={column.accessor}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.accessor)}
                    onChange={() => onColumnToggle(column.accessor)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">{column.header}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
