// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { MapPin, Clock } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';

// const FoodCard = ({ item }) => {
//   const { isNGO } = useAuth();
//   const [showExpiry, setShowExpiry] = useState(false);
  
//   const getLinkDestination = () => {
//     if (isNGO() && item.type === 'Donation') {
//       return `/donation-request/${item.id}`;
//     }
//     return `/item/${item.id}`;
//   };

//   const getButtonText = () => {
//     if (item.type === 'Donation') return 'Request';
//     return 'Order Now';
//   };

//   return (
//     <div className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700/50">
//       <Link to={getLinkDestination()} className="block">
//         {/* Image container */}
//         <div className="relative pt-[75%] overflow-hidden">
//           <img 
//             src={item.image} 
//             alt={item.title} 
//             className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
//           />
          
//           {/* Save Badge with hover effect for expiry */}
//           {item.type === 'Discount' && (
//             <div 
//               className="absolute top-3 left-3 group/save"
//               onMouseEnter={() => setShowExpiry(true)}
//               onMouseLeave={() => setShowExpiry(false)}
//             >
//               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
//                 Save R{(item.originalPrice - item.discountPrice).toFixed(2)}
//               </span>
//               {showExpiry && (
//                 <div className="absolute left-0 bottom-full mb-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
//                   <div className="flex items-center">
//                     <Clock size={12} className="mr-1 flex-shrink-0" />
//                     <span>Expires: {item.expirationTime}</span>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
          
//           {/* Item type badge */}
//           <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${
//             item.type === 'Donation' 
//               ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200' 
//               : 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200'
//           }`}>
//             {item.type}
//           </span>
//         </div>
        
//         {/* Content */}
//         <div className="p-5">
//           <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 text-lg">
//             {item.title}
//           </h3>
          
//           <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center">
//             <MapPin size={14} className="mr-1.5 flex-shrink-0" />
//             <span className="truncate">{item.provider.business_name}</span>
//           </p>
          
//           {/* Price section */}
//           <div className="mb-4">
//             {item.type === 'Discount' ? (
//               <div className="space-y-1">
//                 <div className="text-2xl font-bold text-gray-900 dark:text-white">
//                   R{item.discountPrice.toFixed(2)}
//                 </div>
//                 <div className="text-sm text-gray-400 line-through">
//                   R{item.originalPrice.toFixed(2)}
//                 </div>
//               </div>
//             ) : (
//               <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
//                 Free
//               </div>
//             )}
//           </div>
          
//           {/* Footer */}
//           <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700">
//             <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
//               <MapPin size={12} className="mr-1" />
//               {item.distance}
//             </div>
//             <button 
//               type="button"
//               className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 // Handle order/request logic here
//               }}
//             >
//               {getButtonText()}
//             </button>
//           </div>
//         </div>
//       </Link>
//     </div>
//   );
// };

// export default FoodCard;



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
    return 'Order Now';
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700/50">
      <Link to={getLinkDestination()} className="block">
        {/* Image container */}
        <div className="relative pt-[75%] overflow-hidden">
          <img 
            src={item.image} 
            alt={item.title} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          
          {/* Save Badge with hover effect for expiry */}
          {item.type === 'Discount' && (
            <div 
              className="absolute top-3 left-3 group/save"
              onMouseEnter={() => setShowExpiry(true)}
              onMouseLeave={() => setShowExpiry(false)}
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
                Save R{(item.originalPrice - item.discountPrice).toFixed(2)}
              </span>
              {showExpiry && (
                <div className="absolute left-0 bottom-full mb-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1 flex-shrink-0" />
                    <span>Expires: {item.expirationTime}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Item type badge */}
          <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${
            item.type === 'Donation' 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200'
          }`}>
            {item.type}
          </span>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 text-lg">
            {item.title}
          </h3>
          
          {/* Provider + Distance on the same line */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate">{item.provider.business_name}</span>
            <span className="text-gray-400">| {item.distance}</span>
          </p>
          
          {/* Price section - make it the most dominant visually */}
<div className="mb-4">
  {item.type === 'Discount' ? (
    <div className="flex items-baseline gap-2">
      {/* Discounted Price (big & bold) */}
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
        R{item.discountPrice.toFixed(2)}
      </div>

      {/* Original Price (smaller, strikethrough) */}
      <div className="text-sm text-gray-400 line-through">
        R{item.originalPrice.toFixed(2)}
      </div>
    </div>
  ) : (
    <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
      Free
    </div>
  )}
</div>

          
          {/* Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            {/* Full-width button */}
            <button 
              type="button"
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle order/request logic here
              }}
            >
              {getButtonText()}
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default FoodCard;
