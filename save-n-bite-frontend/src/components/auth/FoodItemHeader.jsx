import React from 'react';
import { MapPinIcon, ClockIcon, ShoppingCartIcon } from 'lucide-react';

const FoodItemHeader = ({ title, provider, type }) => (
  <div className="mb-4">
    <span className={`text-xs font-medium px-2 py-1 rounded ${
      type === 'donation' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
    }`}>
      {type === 'donation' ? 'Donation' : 'Discount'}
    </span>
    <h1 className="text-2xl font-bold mt-2 mb-1 text-gray-800">{title}</h1>
    <p className="text-gray-600">by {provider}</p>
  </div>
);

export default FoodItemHeader;