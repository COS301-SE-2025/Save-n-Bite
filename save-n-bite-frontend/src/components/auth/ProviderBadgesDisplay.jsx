// src/components/auth/ProviderBadgesDisplay.jsx
import React, { useState, useEffect } from 'react';
import badgesAPI from '../../services/badgesAPI';

const ProviderBadgesDisplay = ({ providerId }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (providerId) {
      loadProviderBadges();
    }
  }, [providerId]);

  const loadProviderBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await badgesAPI.getProviderBadges(providerId);
      
      // Only show pinned badges for public display
      setBadges(response.badges || []);
    } catch (err) {
      console.error('Error loading provider badges:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-600 border-gray-300',
      uncommon: 'text-green-600 border-green-300',
      rare: 'text-blue-600 border-blue-300',
      epic: 'text-purple-600 border-purple-300',
      legendary: 'text-yellow-600 border-yellow-300'
    };
    return colors[rarity] || colors.common;
  };

  const getBadgeGlow = (rarity) => {
    const glows = {
      common: 'hover:shadow-md',
      uncommon: 'hover:shadow-lg hover:shadow-green-200',
      rare: 'hover:shadow-lg hover:shadow-blue-200',
      epic: 'hover:shadow-lg hover:shadow-purple-200',
      legendary: 'hover:shadow-xl hover:shadow-yellow-200'
    };
    return glows[rarity] || glows.common;
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse">
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            ))}
          </div>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading badges...</span>
      </div>
    );
  }

  if (error || !badges.length) {
    return null; // Don't show anything if there's an error or no badges
  }

  // Filter out Community Builder badge as requested
  const filteredBadges = badges.filter(
    badge => badge.badge_type?.name !== 'Community Builder'
  );

  if (!filteredBadges.length) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {filteredBadges.slice(0, 5).map((badge, index) => {
          const rarity = badge.badge_type?.rarity || 'common';
          const rarityColor = getBadgeRarityColor(rarity);
          const glowEffect = getBadgeGlow(rarity);

          return (
            <div
              key={badge.id}
              className={`relative group transition-all duration-300 ${glowEffect}`}
              title={`${badge.badge_type?.name}: ${badge.badge_type?.description}`}
            >
              {/* Badge Icon */}
              <div
                className={`w-8 h-8 rounded-full border-2 ${rarityColor} bg-white dark:bg-gray-800 
                  flex items-center justify-center transform transition-transform duration-200
                  group-hover:scale-110 group-hover:z-10`}
              >
                {/* SVG Icon placeholder - you'll need to implement actual SVG rendering */}
                <div className={`w-5 h-5 rounded-full ${rarityColor.replace('border-', 'bg-')}`}>
                  {/* You can replace this with actual SVG icons */}
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-full h-full"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                invisible group-hover:visible bg-gray-900 dark:bg-gray-700 text-white text-xs 
                rounded-lg px-3 py-2 whitespace-nowrap z-20 shadow-lg">
                <div className="font-semibold">{badge.badge_type?.name}</div>
                <div className="text-gray-300 dark:text-gray-400 text-xs">
                  {badge.badge_type?.description}
                </div>
                <div className={`text-xs font-medium mt-1 ${rarityColor.split(' ')[0]}`}>
                  {badge.badge_type?.rarity_display || badge.badge_type?.rarity}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                  border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge count indicator if there are more than 5 badges */}
      {filteredBadges.length > 5 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          +{filteredBadges.length - 5} more
        </span>
      )}
    </div>
  );
};

export default ProviderBadgesDisplay;