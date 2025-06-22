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
    // Check current follow status on mount
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
        
        // Call callback if provided
        if (onFollowChange) {
          onFollowChange(!isFollowing, businessId);
        }

        // Show success message briefly
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
      button: 'bg-white border-2 border-gray-200 hover:border-red-300 text-gray-600 hover:text-red-600',
      buttonActive: 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100',
      icon: 'text-gray-400',
      iconActive: 'text-red-500 fill-current'
    },
    minimal: {
      button: 'bg-transparent hover:bg-gray-50 text-gray-600 hover:text-red-600',
      buttonActive: 'bg-red-50 text-red-600',
      icon: 'text-gray-400',
      iconActive: 'text-red-500 fill-current'
    },
    card: {
      button: 'bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white text-gray-600 hover:text-red-600',
      buttonActive: 'bg-red-500 text-white hover:bg-red-600',
      icon: 'text-gray-400',
      iconActive: 'text-white fill-current'
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
          ${error ? 'border-red-300' : ''}
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
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap z-50">
          {error}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-red-500"></div>
        </div>
      )}
    </div>
  );
};

export default FollowButton;