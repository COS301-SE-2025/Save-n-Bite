import React from 'react';
import FoodCard from './FoodCard';

const FoodListingsGrid = ({ listings }) => {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
          Available Food ({listings.length})
        </h2>
      </div>
      
      {/* Enhanced Grid for Better Large Screen Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 xl:gap-12">
        {listings.map(item => (
          <div key={item.id + '-' + (item.provider?.id || '')} className="w-full max-w-sm mx-auto">
            <FoodCard item={item} />
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {listings.length === 0 && (
        <div className="text-center py-16 lg:py-24">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full mb-6">
              <svg className="w-10 h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xl lg:text-2xl text-gray-600 mb-4 font-medium">
            No food listings found
          </p>
          <p className="text-gray-500 text-base lg:text-lg max-w-md mx-auto">
            Try adjusting your filters or check back later for new listings
          </p>
        </div>
      )}
    </div>
  );
};

export default FoodListingsGrid;