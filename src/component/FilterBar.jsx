import React from 'react';
import { Search, X } from 'lucide-react';

export const FilterBar = ({
  filters,
  onFilterChange,
  onClearFilters,
  searchPlaceholder = 'Search organizations...',
}) => {
  const handleInputChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== '');

  return (
    <div className="bg-white text-black rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filters.organizationName || ''}
            onChange={(e) => handleInputChange('organizationName', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>

        <input
          type="date"
          value={filters.createdAt || ''}
          onChange={(e) => handleInputChange('createdAt', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        />

        <select
          value={filters.packageName || ''}
          onChange={(e) => handleInputChange('packageName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        >
          <option value="">All Packages</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      )}
    </div>
  );
};
