import React from 'react';

const SingleRelatedItem = ({ item }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
    <div className="relative">
      <img src={item.images[0]} alt={item.name} className="w-full h-48 object-cover" />
      <div className="absolute top-0 right-0 m-2">
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          item.type === 'donation'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
        }`}>
          {item.type === 'donation' ? 'Donation' : 'Discount'}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-lg mb-1 text-gray-800 dark:text-gray-100">{item.name}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{item.provider.businessName}</p>
      <div className="flex items-center">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          R{item.discountedPrice.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 line-through ml-2">
          R{item.originalPrice.toFixed(2)}
        </span>
      </div>
    </div>
  </div>
);

export default SingleRelatedItem;