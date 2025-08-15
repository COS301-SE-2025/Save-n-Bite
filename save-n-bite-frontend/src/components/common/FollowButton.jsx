// components/common/FollowButton.jsx
import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import BusinessAPI from '../../services/BusinessAPI';

const FollowButton = ({
  businessId,
  businessName,
  initialFollowStatus = false,
  size = 'md',
  variant = 'default',
  onFollowChange
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkFollowStatus();
  }, [businessId]);

  const checkFollowStatus = async () => {
    try {
      const response = await BusinessAPI.checkFollowStatus(businessId);
      if (response.success) {
        setIsFollowing(response.isFollowing);
      }
    } catch (err) {
      console.error('Failed to check follow status:', err);
    }
  };

  const handleFollowToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    setError(null);

    try {
      let response;
      if (isFollowing) {
        response = await BusinessAPI.unfollowBusiness(businessId);
      } else {
        response = await BusinessAPI.followBusiness(businessId);
      }

      if (response.success) {
        setIsFollowing(!isFollowing);

        if (onFollowChange) {
          onFollowChange(!isFollowing, businessId);
        }
        setError(null);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  // Size configurations
  const sizes = {
    sm: {
      button: 'p-1.5',
      icon: 16,
      text: 'text-xs'
    },
    md: {
      button: 'p-2',
      icon: 18,
      text: 'text-sm'
    },
    lg: {
      button: 'p-3',
      icon: 20,
      text: 'text-base'
    }
  };

  // Variant configurations
  const variants = {
    default: {
      button: 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-400 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400',
      buttonActive: 'bg-red-50 dark:bg-red-900 border-red-500 dark:border-red-400 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800',
      icon: 'text-gray-400 dark:text-gray-500',
      iconActive: 'text-red-500 dark:text-red-400 fill-current'
    },
    minimal: {
      button: 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400',
      buttonActive: 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400',
      icon: 'text-gray-400 dark:text-gray-500',
      iconActive: 'text-red-500 dark:text-red-400 fill-current'
    },
    card: {
      button: 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-white/20 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400',
      buttonActive: 'bg-red-500 dark:bg-red-700 text-white dark:text-gray-100 hover:bg-red-600 dark:hover:bg-red-800',
      icon: 'text-gray-400 dark:text-gray-500',
      iconActive: 'text-white dark:text-gray-100 fill-current'
    }
  };

  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  return (
    <div className="relative">
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`
          ${sizeConfig.button}
          ${isFollowing ? variantConfig.buttonActive : variantConfig.button}
          rounded-full transition-all duration-200 flex items-center space-x-1
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          ${error ? 'border-red-300 dark:border-red-400' : ''}
        `}
        title={isFollowing ? `Unfollow ${businessName}` : `Follow ${businessName}`}
      >
        {loading ? (
          <Loader2 size={sizeConfig.icon} className="animate-spin" />
        ) : (
          <Heart
            size={sizeConfig.icon}
            className={`
              transition-all duration-200
              ${isFollowing ? variantConfig.iconActive : variantConfig.icon}
            `}
          />
        )}

        {size === 'lg' && (
          <span className={`${sizeConfig.text} font-medium`}>
            {isFollowing ? 'Following' : 'Follow'}
          </span>
        )}
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-red-500 dark:bg-red-700 text-white text-xs rounded whitespace-nowrap z-50">
          {error}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-red-500 dark:border-b-red-700"></div>
        </div>
      )}
    </div>
  );
};

export default FollowButton;