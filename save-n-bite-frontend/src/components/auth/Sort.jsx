import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from 'lucide-react';

const sortOptions = [
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
  { label: 'Name', value: 'name' },
  { label: 'Expiry Date', value: 'expiry' },
  { label: 'Newest First', value: 'newest' }
];

const Sort = ({ selectedSort, setSelectedSort }) => {
  return (
    <select
      value={selectedSort}
      onChange={(e) => setSelectedSort(e.target.value)}
      className="p-2 border rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    >
      <option value="">Sort by</option>
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Sort;
