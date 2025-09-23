import React from 'react';
import FoodCard from './FoodCard';
import { SlidersHorizontal } from 'lucide-react';

const FoodListingsGrid = ({ 
  listings, 
  isLoading = false, 
  onFilterClick, 
  activeFiltersCount = 0,
  sortOption = 'relevance',
  onSortChange,
  totalResults = 0
}) => {
  return (
    <div>
      {/* Grid of food cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-48 sm:h-64"></div>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {listings.map((item) => (
            <FoodCard key={`${item.id}-${item.provider?.id || ''}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No food listings found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your filters or check back later for new listings
          </p>
          {onFilterClick && (
            <button
              onClick={onFilterClick}
              className="mt-6 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Adjust Filters
            </button>
          )}
        </div>
      )}
      
      {/* View All Providers Button - Aligned with grid */}
      {/* <div className="flex justify-end mt-6">
        <a
          href="/providers"
          className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
        >
          View All Food Providers
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div> */}
    </div>
  );
};

export default FoodListingsGrid;