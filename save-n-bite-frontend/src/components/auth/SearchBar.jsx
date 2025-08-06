import React from 'react';
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react';

const SearchBar = ({ searchQuery, setSearchQuery, showFilters, setShowFilters }) => {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm p-4 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder="Search for meals..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
          <SearchIcon 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" 
          />
        </div>
        <button 
          className="ml-4 px-4 py-2 bg-emerald-600 text-white rounded-md flex items-center hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors duration-200" 
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? (
            <XIcon size={18} className="mr-1" />
          ) : (
            <FilterIcon size={18} className="mr-1" />
          )}
          <span className="hidden sm:inline">
            {showFilters ? 'Hide Filters' : 'Filters'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;