// src/components/auth/ProviderBadgesDisplay.jsx
import React, { useState, useEffect } from 'react';
import badgesAPI from '../../services/badgesAPI';
import BadgeSVG from '../badges/BadgeSVG';
import { X } from 'lucide-react';

const ProviderBadgesDisplay = ({ providerId }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const handleBadgeClick = (badge) => {
    if (isMobile) {
      setSelectedBadge(badge);
    }
  };

  const closeBadgeModal = () => {
    setSelectedBadge(null);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse">
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
        <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Loading badges...</span>
      </div>
    );
  }

  if (error || !badges.length) {
    return null;
  }

  // Filter out Community Builder badge
  const filteredBadges = badges.filter(
    badge => badge.badge_type?.name !== 'Community Builder'
  );

  if (!filteredBadges.length) {
    return null;
  }

  return (
    <>
      <div className="flex items-center space-x-2 md:space-x-3">
        <div className="flex items-center space-x-1 md:space-x-2">
          {filteredBadges.slice(0, 4).map((badge, index) => {
            const rarity = badge.badge_type?.rarity || 'common';
            const rarityGradient = getRarityGradient(rarity);
            const glowEffect = getRarityGlow(rarity);

            return (
              <div
                key={badge.id}
                className={`relative group transition-all duration-300 ${!isMobile ? glowEffect : ''}`}
                title={!isMobile ? `${badge.badge_type?.name}: ${badge.badge_type?.description}` : ''}
                onClick={() => handleBadgeClick(badge)}
              >
                {/* Badge Card - smaller on mobile */}
                <div
                  className={`w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg border-2 bg-gradient-to-br ${rarityGradient}
                    flex items-center justify-center transform transition-all duration-200
                    ${!isMobile ? 'group-hover:scale-110 group-hover:z-10' : 'active:scale-95'}
                    ${isMobile ? 'cursor-pointer' : 'cursor-default'} shadow-sm`}
                >
                  {/* Badge SVG */}
                  <div className="w-full h-full p-1">
                    <BadgeSVG badge={badge} className="w-full h-full" />
                  </div>

                  {/* Rarity indicator dot - smaller on mobile */}
                  <div className={`absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white ${
                    rarity === 'legendary' ? 'bg-yellow-400' :
                    rarity === 'epic' ? 'bg-purple-400' :
                    rarity === 'rare' ? 'bg-blue-400' :
                    rarity === 'uncommon' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></div>
                </div>

                {/* Desktop Tooltip - only show on non-mobile */}
                {!isMobile && (
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
                )}
              </div>
            );
          })}
        </div>

        {/* Badge count indicator - smaller on mobile */}
        {filteredBadges.length > 4 && (
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              +{filteredBadges.length - 4}
            </span>
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 
              border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {filteredBadges.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Modal for Badge Details */}
      {isMobile && selectedBadge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={closeBadgeModal}
              className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X size={16} className="text-gray-600 dark:text-gray-300" />
            </button>

            {/* Badge Display */}
            <div className="flex flex-col items-center text-center">
              <div className={`w-40 h-05 rounded-xl border-2 bg-gradient-to-br ${getRarityGradient(selectedBadge.badge_type?.rarity || 'common')}
                flex items-center justify-center mb-4 relative shadow-lg`}>
                <div className="w-full h-full p-2">
                  <BadgeSVG badge={selectedBadge} className="w-full h-full" />
                </div>
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  selectedBadge.badge_type?.rarity === 'legendary' ? 'bg-yellow-400' :
                  selectedBadge.badge_type?.rarity === 'epic' ? 'bg-purple-400' :
                  selectedBadge.badge_type?.rarity === 'rare' ? 'bg-blue-400' :
                  selectedBadge.badge_type?.rarity === 'uncommon' ? 'bg-green-400' : 'bg-gray-400'
                }`}></div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {selectedBadge.badge_type?.name}
              </h3>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                {selectedBadge.badge_type?.description}
              </p>

              <div className="flex items-center justify-between w-full pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                  selectedBadge.badge_type?.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  selectedBadge.badge_type?.rarity === 'epic' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                  selectedBadge.badge_type?.rarity === 'rare' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  selectedBadge.badge_type?.rarity === 'uncommon' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {selectedBadge.badge_type?.rarity_display || selectedBadge.badge_type?.rarity}
                </span>

                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {selectedBadge.earned_date_formatted}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProviderBadgesDisplay;
