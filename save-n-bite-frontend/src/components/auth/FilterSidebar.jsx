import React from 'react';
import { ChevronDownIcon } from 'lucide-react';

const FilterSidebar = ({ showFilters, filters, setFilters, providerOptions, onResetFilters }) => {
  if (!showFilters) return null;

  const handlePriceRangeChange = (e) => {
    const value = parseInt(e.target.value);
    setFilters({
      ...filters,
      priceRange: [0, value]
    });
  };

  return (
    <div className="w-full lg:w-64 bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 card-responsive">
      <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-gray-800">
        Filters
      </h3>
      
      {/* Price Range Filter */}
      <div className="mb-4 sm:mb-6">
        <h4 className="font-medium mb-2 text-sm sm:text-base text-gray-700">Price Range</h4>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-gray-600">
            R{filters.priceRange[0]}
          </span>
          <span className="text-xs sm:text-sm text-gray-600">
            R{filters.priceRange[1]}
          </span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="10000" 
          step="100"
          value={filters.priceRange[1]} 
          onChange={handlePriceRangeChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 touch-target" 
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>R0</span>
          <span>R10,000</span>
        </div>
      </div>
      
      {/* Expiration Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2 text-gray-700">
          Expiration Time
        </h4>
        <div className="relative">
          <select 
            className="w-full p-2 border border-gray-300 rounded-md appearance-none focus:ring-emerald-500 focus:border-emerald-500 transition-colors" 
            value={filters.expiration} 
            onChange={(e) => setFilters({
              ...filters,
              expiration: e.target.value
            })}
          >
            <option value="all">All Times</option>
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="later">Later</option>
          </select>
          <ChevronDownIcon 
            size={16} 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
        </div>
      </div>
      
      {/* Type Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2 text-gray-700">Type</h4>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer group">
            <input 
              type="radio" 
              name="type" 
              value="all" 
              checked={filters.type === 'all'} 
              onChange={() => setFilters({
                ...filters,
                type: 'all'
              })} 
              className="mr-2 accent-emerald-600" 
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">All</span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <input 
              type="radio" 
              name="type" 
              value="discount" 
              checked={filters.type === 'discount'} 
              onChange={() => setFilters({
                ...filters,
                type: 'discount'
              })} 
              className="mr-2 accent-emerald-600" 
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Discounted Items</span>
          </label>
          <label className="flex items-center cursor-pointer group">
            <input 
              type="radio" 
              name="type" 
              value="donation" 
              checked={filters.type === 'donation'} 
              onChange={() => setFilters({
                ...filters,
                type: 'donation'
              })} 
              className="mr-2 accent-emerald-600" 
            />
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">Donations</span>
          </label>
        </div>
      </div>

      {/* Provider Filter */}
      <div className="mb-6">
        <h4 className="font-medium mb-2 text-gray-700">Provider</h4>
        <div className="relative">
          <select 
            className="w-full p-2 border border-gray-300 rounded-md appearance-none focus:ring-emerald-500 focus:border-emerald-500 transition-colors" 
            value={filters.provider}
            onChange={(e) => setFilters({
              ...filters,
              provider: e.target.value
            })}
          >
            <option value="all">All Providers</option>
            {providerOptions.map((provider, idx) => (
              <option key={idx} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          <ChevronDownIcon 
            size={16} 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
        </div>
      </div>
      
      {/* Reset Filters Button */}
      <button 
        className="w-full py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium text-gray-700" 
        onClick={onResetFilters || (() => setFilters({
          priceRange: [0, 10000],
          expiration: 'all',
          type: 'all',
          provider: 'all'
        }))}
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterSidebar;