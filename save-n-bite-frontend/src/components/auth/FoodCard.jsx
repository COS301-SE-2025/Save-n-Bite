import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FoodCard = ({ item }) => {
  const { isNGO } = useAuth();
  const [showExpiry, setShowExpiry] = useState(false);
  
  const getLinkDestination = () => {
    if (isNGO() && item.type === 'Donation') {
      return `/donation-request/${item.id}`;
    }
    return `/item/${item.id}`;
  };

  const getButtonText = () => {
    if (item.type === 'Donation') return 'Request';
    return 'Order';
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700/50">
      <Link to={getLinkDestination()} className="block h-full flex flex-col">
        {/* Image container - smaller on mobile */}
        <div className="relative pt-[70%] sm:pt-[75%] overflow-hidden">
          <img 
            src={item.image} 
            alt={item.title} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
          
          {/* Save Badge - smaller on mobile */}
          {item.type === 'Discount' && (
            <div 
              className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 group/save"
              onMouseEnter={() => setShowExpiry(true)}
              onMouseLeave={() => setShowExpiry(false)}
            >
              <span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm">
                Save R{(item.originalPrice - item.discountPrice).toFixed(0)}
              </span>
              {showExpiry && (
                <div className="hidden sm:block absolute left-0 bottom-full mb-2 w-40 px-2 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
                  <div className="flex items-center">
                    <Clock size={10} className="mr-1 flex-shrink-0" />
                    <span>Expires: {item.expirationTime}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Item type badge - smaller on mobile */}
          <span className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
            item.type === 'Donation' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200'
          }`}>
            {item.type}
          </span>
        </div>
        
        {/* Content - more compact on mobile */}
        <div className="p-2 sm:p-3 flex-1 flex flex-col">
          <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-1 sm:mb-2">
            {item.title}
          </h3>
          
          {/* Provider name - single line with ellipsis */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 truncate">
            {item.provider?.business_name || 'Save-n-Bite'}
          </p>
          
          {/* Price section - compact layout */}
          <div className="mt-auto">
            {item.type === 'Discount' ? (
              <div className="flex items-baseline gap-1.5">
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  R{item.discountPrice.toFixed(2)}
                </div>
                <div className="text-xs text-gray-400 line-through">
                  R{item.originalPrice.toFixed(2)}
                </div>
              </div>
            ) : (
              <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Free
              </div>
            )}
          </div>
          
          {/* Order button - full width but smaller */}
          <button 
            type="button"
            className="mt-2 w-full px-2 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:ring-offset-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Handle order/request logic here
            }}
          >
            {getButtonText()}
          </button>
        </div>
      </Link>
    </div>
  );
};

export default FoodCard;
