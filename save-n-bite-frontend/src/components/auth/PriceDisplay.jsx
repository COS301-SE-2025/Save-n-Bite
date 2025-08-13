import React from 'react';

const PriceDisplay = ({ originalPrice, discountedPrice }) => (
  <div className="mb-6">
    <div className="flex items-center mb-2">
      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
        R{discountedPrice.toFixed(2)}
      </span>
      <span className="text-gray-500 dark:text-gray-400 line-through ml-2">
        R{originalPrice.toFixed(2)}
      </span>
      <span className="ml-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs px-2 py-1 rounded">
        {Math.round((1 - discountedPrice / originalPrice) * 100)}% off
      </span>
    </div>
  </div>
);

export default PriceDisplay;