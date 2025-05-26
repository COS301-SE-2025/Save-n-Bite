import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const OrderFilters = ({ filters, setFilters, orders, userType, onResetFilters }) => {
  // Get unique providers from orders
  const uniqueProviders = [...new Set(orders.map(order => order.provider))];
  
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const typeOptions = userType === 'ngo' 
    ? [
        { value: 'all', label: 'All Types' },
        { value: 'donation', label: 'Donations Only' }
      ]
    : [
        { value: 'all', label: 'All Types' },
        { value: 'purchase', label: 'Purchases Only' },
        { value: 'donation', label: 'Donations Only' }
      ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last Month' },
    { value: 'year', label: 'Last Year' }
  ];

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <Filter size={18} className="mr-2" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Provider Filter */}
        {uniqueProviders.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Providers</option>
              {uniqueProviders.map(provider => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h4>
            <div className="space-y-1">
              {filters.status !== 'all' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Status:</span>
                  <span className="text-xs font-medium text-emerald-600 capitalize">
                    {filters.status}
                  </span>
                </div>
              )}
              {filters.type !== 'all' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Type:</span>
                  <span className="text-xs font-medium text-emerald-600 capitalize">
                    {filters.type}
                  </span>
                </div>
              )}
              {filters.dateRange !== 'all' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Date:</span>
                  <span className="text-xs font-medium text-emerald-600">
                    {dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}
                  </span>
                </div>
              )}
              {filters.provider !== 'all' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Provider:</span>
                  <span className="text-xs font-medium text-emerald-600">
                    {filters.provider}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderFilters;