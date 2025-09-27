// src/components/auth/ProviderBadgesDisplay.jsx
import React, { useState, useEffect } from 'react';
import badgesAPI from '../../services/badgesAPI';
import BadgeSVG from '../badges/BadgeSVG';

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

  const getRarityGradient = (rarity) => {
    const gradients = {
      common: 'from-gray-100 to-gray-200 border-gray-300',
      uncommon: 'from-green-100 to-green-200 border-green-300',
      rare: 'from-blue-100 to-blue-200 border-blue-300',
      epic: 'from-purple-100 to-purple-200 border-purple-300',
      legendary: 'from-yellow-100 to-yellow-200 border-yellow-300'
    };
    return gradients[rarity] || gradients.common;
  };

  const getRarityGlow = (rarity) => {
    const glows = {
      common: 'hover:shadow-md',
      uncommon: 'hover:shadow-lg hover:shadow-green-200/50',
      rare: 'hover:shadow-lg hover:shadow-blue-200/50',
      epic: 'hover:shadow-lg hover:shadow-purple-200/50',
      legendary: 'hover:shadow-xl hover:shadow-yellow-200/50 hover:animate-pulse'
    };
    return glows[rarity] || glows.common;
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse">
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {filteredBadges.slice(0, 4).map((badge, index) => {
          const rarity = badge.badge_type?.rarity || 'common';
          const rarityGradient = getRarityGradient(rarity);
          const glowEffect = getRarityGlow(rarity);

          return (
            <div
              key={badge.id}
              className={`relative group transition-all duration-300 ${glowEffect}`}
              title={`${badge.badge_type?.name}: ${badge.badge_type?.description}`}
            >
              {/* Badge Card - similar to food listing style */}
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 bg-gradient-to-br ${rarityGradient}
                  flex items-center justify-center transform transition-all duration-200
                  group-hover:scale-110 group-hover:z-10 cursor-pointer shadow-sm`}
              >
                {/* Badge SVG */}
                <div className="w-6 h-6 sm:w-7 sm:h-7">
                  <BadgeSVG badge={badge} className="w-full h-full" />
                </div>

                {/* Rarity indicator dot */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  rarity === 'legendary' ? 'bg-yellow-400' :
                  rarity === 'epic' ? 'bg-purple-400' :
                  rarity === 'rare' ? 'bg-blue-400' :
                  rarity === 'uncommon' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
              </div>

              {/* Enhanced Tooltip - similar to food card overlay */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 
                invisible group-hover:visible bg-white dark:bg-gray-800 rounded-lg shadow-xl
                border border-gray-200 dark:border-gray-600 p-3 whitespace-nowrap z-20 
                min-w-48 transition-all duration-200 opacity-0 group-hover:opacity-100">
                
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {badge.badge_type?.name}
                </div>
                
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {badge.badge_type?.description}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    rarity === 'uncommon' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {badge.badge_type?.rarity_display || badge.badge_type?.rarity}
                  </span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {badge.earned_date_formatted}
                  </span>
                </div>

                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                  border-4 border-transparent border-t-white dark:border-t-gray-800"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge count indicator with emerald theme */}
      {filteredBadges.length > 4 && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            +{filteredBadges.length - 4}
          </span>
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 
            border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {filteredBadges.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProviderBadgesDisplay;