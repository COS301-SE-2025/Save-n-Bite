import React from 'react';
import { SearchIcon, FilterIcon, XIcon, ChevronDown } from 'lucide-react';

const SearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  showFilters, 
  setShowFilters,
  selectedSort,
  setSelectedSort
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 shadow-sm p-4 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
            placeholder="Search for meals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort and Filter Buttons */}
        <div className="flex gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors duration-200 cursor-pointer"
            >
              <option value="">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="distance">Distance</option>
              <option value="expiry">Expiry Date</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowFilters(!showFilters);
            }}
            className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
              showFilters
                ? 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {showFilters ? (
              <XIcon className="h-4 w-4 mr-2" />
            ) : (
              <FilterIcon className="h-4 w-4 mr-2" />
            )}
            <span>Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;