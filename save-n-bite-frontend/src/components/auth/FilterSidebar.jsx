import React from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { USER_TYPES } from '../../utils/constants';

const FilterSidebar = ({ 
  showFilters, 
  filters, 
  setFilters, 
  providerOptions = [], 
  typeOptions = [],
  onResetFilters ,
    userType
}) => {
  if (!showFilters) return null;

  console.log('FilterSidebar - userType:', userType);
  console.log('FilterSidebar - USER_TYPES.NGO:', USER_TYPES.NGO);
  console.log('FilterSidebar - typeOptions:', typeOptions);

  const handlePriceRangeChange = (e) => {
    const value = parseInt(e.target.value);
    setFilters({
      ...filters,
      priceRange: [0, value]
    });
  };

  return (
<div className="w-full lg:w-64 bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 card-responsive transition-colors duration-300">
  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-800 dark:text-gray-100">

        Filters
      </h3>
      
      {/* Price Range Filter */}
<div className="mb-4 sm:mb-6">
  <h4 className="font-medium mb-2 text-sm sm:text-base text-gray-700 dark:text-gray-200">Price Range</h4>
  <div className="flex items-center justify-between mb-2">
    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
      R{filters.priceRange[0]}
    </span>
    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
            R{filters.priceRange[1]}
          </span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1000" 
          step="10"
          value={filters.priceRange[1]} 
          onChange={handlePriceRangeChange}
className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 touch-target"

        />
        <div className="flex justify-between text-xs text-gray-500 dark:text-white mt-1">
          <span>R0</span>
          <span>R1,000</span>
        </div>
      </div>
      
       {/* Type Filter - Only show for NGO users */}
      {userType === USER_TYPES.NGO && typeOptions.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2 text-gray-700 dark:text-white">Item Type</h4>
          <div className="space-y-2">
            {typeOptions.map((option) => (
              <label key={option.value} className="flex items-center cursor-pointer group">
                <input 
                  type="radio" 
                  name="type" 
                  value={option.value} 
                  checked={filters.type === option.value} 
                  onChange={() => setFilters({
                    ...filters,
                    type: option.value
                  })} 
                  className="mr-2 accent-emerald-600" 
                />
                <span className="text-gray-700 group-hover:text-gray-900 transition-colors text-sm">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Provider Filter */}
      {providerOptions.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2 text-gray-700 dark:text-white">Provider</h4>
          <div className="relative">
            <select 
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md appearance-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-900 dark:text-gray-100 transition-colors text-sm"
              value={filters.provider}
              onChange={(e) => setFilters({
                ...filters,
                provider: e.target.value
              })}
            >
              <option className="font-medium mb-2 text-gray-700  dark:text-white"value="all">All Providers</option>
              {providerOptions.map((provider) => (
                <option key={provider.value || provider} value={provider.value || provider}>
                  {provider.label || provider}
                </option>
              ))}
            </select>
            <ChevronDownIcon 
              size={16} 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
          </div>
        </div>
      )}

      {/* Expiration Filter */}
      <div className="mb-6">
<h4 className="font-medium mb-2 text-gray-700 dark:text-gray-200">
  Pickup Deadline
</h4>
<div className="relative">
  <select 
    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md appearance-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-900 dark:text-gray-100 transition-colors text-sm" 
  

            value={filters.expiration} 
            onChange={(e) => setFilters({
              ...filters,
              expiration: e.target.value
            })}
          >
            <option value="all">Any Time</option>
            <option value="today">Must Pick Up Today</option>
            <option value="tomorrow">Must Pick Up Tomorrow</option>
            <option value="this_week">This Week</option>
            <option value="later">Later</option>
          </select>
          <ChevronDownIcon 
            size={16} 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" 
          />
        </div>
      </div>
      

      {/* Reset Filters Button */}
      <button 
  className="w-full py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium text-gray-700 dark:text-gray-200 text-sm" 
        onClick={onResetFilters}

      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterSidebar;