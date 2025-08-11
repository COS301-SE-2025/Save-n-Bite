import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FoodCard = ({ item }) => {
  const { isNGO } = useAuth();
  
  // Fix the getLinkDestination function to match the debug logic
  const getLinkDestination = () => {
    if (isNGO() && item.type === 'Donation') {
      return `/donation-request/${item.id}`;
    }
    return `/item/${item.id}`;
  };

  console.log('FoodCard Debug:', {
    itemType: item.type,
    itemId: item.id,
    isNGOResult: isNGO(),
    linkDestination: getLinkDestination() // Use the actual function instead of duplicating logic
  });

  const getButtonText = () => {
    if (item.type === 'Donation') {
      return 'Request';
    }
    return 'Order';
  };

  const getButtonStyling = () => {
    if (item.type === 'Donation') {
      return 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md';
    }
    return 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md';
  };

  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatusLoading, setFollowStatusLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    async function checkFollow() {
      if (item.id) {
        try {
          // Fix: Initialize isFollowing to false by default
          const followed = localStorage.getItem(`liked_item_${item.id}`);
          if (mounted) {
            setIsFollowing(followed === 'true');
          }
          
          // Optional: Check with backend if you have an API for item likes
          // const res = await BusinessAPI.checkItemLikeStatus(item.id);
          // if (mounted && res.success) {
          //   setIsFollowing(res.isLiked);
          //   localStorage.setItem(`liked_item_${item.id}`, res.isLiked ? 'true' : 'false');
          // }
        } catch (err) {
          console.error('Error checking like status:', err);
          // Fallback to localStorage
          const followed = localStorage.getItem(`liked_item_${item.id}`);
          if (mounted) {
            setIsFollowing(followed === 'true');
          }
        }
      }
    }
    
    checkFollow();
    return () => { mounted = false; };
  }, [item.id]);

  const handleFollowClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!item.id) {
      alert('Item ID not found!');
      return;
    }
    
    setFollowStatusLoading(true);
    
    try {
      // Toggle the like status for this specific item
      const newFollowStatus = !isFollowing;
      setIsFollowing(newFollowStatus);
      
      if (newFollowStatus) {
        localStorage.setItem(`liked_item_${item.id}`, 'true');
      } else {
        localStorage.removeItem(`liked_item_${item.id}`);
      }
      
      // Optional: Update backend if you have an API for item likes
      // if (newFollowStatus) {
      //   await BusinessAPI.likeItem(item.id);
      // } else {
      //   await BusinessAPI.unlikeItem(item.id);
      // }
      
    } catch (error) {
      console.error('Error updating like status:', error);
      // Revert the change if there was an error
      setIsFollowing(!isFollowing);
      alert('Failed to update like status. Please try again.');
    } finally {
      setFollowStatusLoading(false);
    }
  };

  return (
    <Link 
      to={getLinkDestination()}  
      className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group border border-gray-100 dark:border-gray-700"
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
              ? 'bg-emerald-100/90 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/90 dark:text-emerald-200 dark:border-emerald-800' 
              : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/90 dark:text-emerald-200 dark:border-emerald-800'
          }`}>
            {item.type}
          </span>
        </div>
        {/* Savings badge for discounted items */}
        {item.type === 'Discount' && (
          <div className="absolute top-0 left-0 m-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-500 text-white dark:bg-red-700">
              Save R{(item.originalPrice - item.discountPrice).toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 text-gray-800 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-600 dark:text-gray-300 text-sm flex items-center">
            <MapPin size={14} className="mr-1" />
            {item.provider.business_name}
          </p>

          {/* <button
            onClick={handleFollowClick}
            className="text-2xl ml-2 transition-transform duration-200 hover:scale-110 disabled:opacity-50"
            title={isFollowing ? 'Unlike item' : 'Like item'}
            disabled={followStatusLoading}
          >
            {followStatusLoading ? '⏳' : (isFollowing ? '❤️' : '🤍')}
          </button> */}

        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            {item.type === 'Discount' ? (
              <div className="flex items-center">
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  R{item.discountPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                  R{item.originalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                Free
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <MapPin size={12} className="mr-1" />
            {item.distance}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Clock size={12} className="mr-1" />
            Expires: {item.expirationTime}
          </span>
          <button 
          type="button"
          className={`px-3 py-1 text-sm rounded-full font-medium transition-all duration-200 ${getButtonStyling()}`}>
            {getButtonText()}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default FoodCard;