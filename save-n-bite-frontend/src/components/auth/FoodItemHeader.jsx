import React from 'react';
import { MapPinIcon, ClockIcon, ShoppingCartIcon } from 'lucide-react';

const FoodItemHeader = ({ title, provider, type }) => {
  const getTypeDisplay = (type) => {
    switch (type) {
      case 'ready_to_eat':
        return 'Ready to Eat';
      case 'donation':
        return 'Donation';
      default:
        return 'Discount';
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'ready_to_eat':
        return 'bg-orange-100 text-orange-800';
      case 'donation':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-emerald-100 text-emerald-800';
    }
  };

  return (
    <div className="mb-4">
      <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeStyle(type)}`}>
        {getTypeDisplay(type)}
      </span>
      <h1 className="text-2xl font-bold mt-2 mb-1 text-gray-800">{title}</h1>
      <p className="text-gray-600">by {provider}</p>
    </div>
  );
};

export default FoodItemHeader;