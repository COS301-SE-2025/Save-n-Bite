import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom'; 

const FoodCard = ({ item }) => {
    const navigate = useNavigate();

  const handleViewMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/food-item');
  };

  return (
    <Link 
      to={`/item/${item.id}`} 
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group"
    >
      <div className="relative">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute top-0 right-0 m-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm ${
            item.type === 'Donation' 
              ? 'bg-blue-100/90 text-blue-800 border border-blue-200' 
              : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200'
          }`}>
            {item.type}
          </span>
        </div>
        {/* Savings badge for discounted items */}
        {item.type === 'Discount' && (
          <div className="absolute top-0 left-0 m-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white">
              Save R{(item.originalPrice - item.discountPrice).toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 text-gray-800 group-hover:text-emerald-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 flex items-center">
          <MapPin size={14} className="mr-1" />
          {item.provider}
        </p>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            {item.type === 'Discount' ? (
              <div className="flex items-center">
                <span className="font-bold text-lg text-emerald-600">
                  R{item.discountPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through ml-2">
                  R{item.originalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-lg text-blue-600">
                Free
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500 flex items-center">
            <MapPin size={12} className="mr-1" />
            {item.distance}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 flex items-center">
            <Clock size={12} className="mr-1" />
            Expires: {item.expirationTime}
          </span>
          {/* <button className={`px-3 py-1 text-sm rounded-full font-medium transition-all duration-200 ${
            item.type === 'Donation' 
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
          }`}>
            {item.type === 'Donation' ? 'Request' : 'Order'}
          </button> */}
          <button 
            onClick={handleViewMore}
            className="px-3 py-1 text-sm rounded-full font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 hover:shadow-md transition-all duration-200"
          >
            View more
          </button>
        </div>
      </div>
    </Link>
  );
};

export default FoodCard;