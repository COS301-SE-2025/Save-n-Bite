import React from 'react';
import FoodCard from './FoodCard';

const FoodListingsGrid = ({ listings }) => {
  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Available Food ({listings.length})
        </h2>
        {/* <div className="text-sm text-gray-600">
          Sorted by expiration time
        </div> */}
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map(item => (
          <FoodCard key={item.id} item={item} />
        ))}
      </div>
      
      {/* Empty state */}
      {listings.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xl text-gray-600 mb-2">
            No food listings found
          </p>
          <p className="text-gray-500">
            Try adjusting your filters or check back later for new listings
          </p>
        </div>
      )}
    </div>
  );
};

export default FoodListingsGrid;