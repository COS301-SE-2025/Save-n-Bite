// src/components/foodProvider/ProviderBadgesManagement.jsx
import React, { useState, useEffect } from 'react';
import { Download, Pin, PinOff, Star, Award, Trophy, Crown } from 'lucide-react';
import badgesAPI from '../../services/badgesAPI';
import { showToast } from '../ui/Toast';

const ProviderBadgesManagement = ({ onToast }) => {
  const [badges, setBadges] = useState({
    all_badges: [],
    pinned_badges: [],
    total_count: 0,
    categories: {}
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await badgesAPI.getMyBadges();
      setBadges(response.badges);
      setStats(response.stats);
    } catch (err) {
      console.error('Error loading badges:', err);
      setError(err.message);
      onToast?.('Failed to load badges', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (badgeId, currentlyPinned) => {
    try {
      setActionLoading(prev => ({ ...prev, [badgeId]: true }));
      
      const action = currentlyPinned ? 'unpin' : 'pin';
      const response = await badgesAPI.toggleBadgePin(badgeId, action);
      
      // Update the badges state with new pinned badges
      setBadges(prev => ({
        ...prev,
        pinned_badges: response.pinned_badges,
        all_badges: prev.all_badges.map(badge => 
          badge.id === badgeId 
            ? { ...badge, is_pinned: !currentlyPinned }
            : badge
        )
      }));

      onToast?.(
        currentlyPinned ? 'Badge unpinned from profile' : 'Badge pinned to profile',
        'success'
      );
    } catch (err) {
      console.error('Error toggling pin:', err);
      onToast?.(err.message || 'Failed to update badge pin status', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [badgeId]: false }));
    }
  };

  const handleDownload = async (badgeId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`download_${badgeId}`]: true }));
      
      const response = await badgesAPI.getBadgeDownload(badgeId);
      const { badge_info, download_url } = response;
      
      // Create a download link for the SVG
      const link = document.createElement('a');
      link.href = download_url;
      link.download = `${badge_info.name.replace(/\s+/g, '_')}_badge.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onToast?.('Badge downloaded successfully', 'success');
    } catch (err) {
      console.error('Error downloading badge:', err);
      onToast?.(err.message || 'Failed to download badge', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`download_${badgeId}`]: false }));
    }
  };

  const getBadgeRarityStyle = (rarity) => {
    const styles = {
      common: 'border-gray-300 bg-gray-50 text-gray-700',
      uncommon: 'border-green-300 bg-green-50 text-green-700',
      rare: 'border-blue-300 bg-blue-50 text-blue-700',
      epic: 'border-purple-300 bg-purple-50 text-purple-700',
      legendary: 'border-yellow-300 bg-yellow-50 text-yellow-700'
    };
    return styles[rarity] || styles.common;
  };

  const getBadgeIcon = (category) => {
    const icons = {
      performance: Trophy,
      milestone: Award,
      recognition: Star,
      monthly: Crown,
      special: Award
    };
    return icons[category] || Award;
  };

  const getCategoryBadges = (category) => {
    return badges.all_badges.filter(badge => badge.badge_type.category === category);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>Failed to load badges: {error}</p>
          <button 
            onClick={loadBadges}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'performance', name: 'Performance', description: 'Competition & ranking badges' },
    { key: 'milestone', name: 'Milestone', description: 'Achievement milestones' },
    { key: 'recognition', name: 'Recognition', description: 'Quality & excellence' },
    { key: 'monthly', name: 'Monthly', description: 'Monthly achievements' },
    { key: 'special', name: 'Special', description: 'Special events & recognition' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Badges
        </h3>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.total_badges}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.pinned_badges_count}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Pinned</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.rare_badges + stats.epic_badges + stats.legendary_badges}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Rare+</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.rarity_score}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Score</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {badges.pinned_badges.length}/5
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Pin Slots</div>
            </div>
          </div>
        )}

        {/* Pinned Badges Section */}
        {badges.pinned_badges.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
              Pinned Badges (Shown on Your Profile)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.pinned_badges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isPinned={true}
                  onTogglePin={handleTogglePin}
                  onDownload={handleDownload}
                  actionLoading={actionLoading}
                  getBadgeRarityStyle={getBadgeRarityStyle}
                  getBadgeIcon={getBadgeIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Badges by Category */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryBadges = getCategoryBadges(category.key);
            if (categoryBadges.length === 0) return null;

            const IconComponent = getBadgeIcon(category.key);

            return (
              <div key={category.key}>
                <div className="flex items-center mb-3">
                  <IconComponent className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {category.name} ({categoryBadges.length})
                  </h4>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {category.description}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryBadges
                    .filter(badge => badge.badge_type.name !== 'Community Builder')
                    .map((badge) => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        isPinned={badge.is_pinned}
                        onTogglePin={handleTogglePin}
                        onDownload={handleDownload}
                        actionLoading={actionLoading}
                        getBadgeRarityStyle={getBadgeRarityStyle}
                        getBadgeIcon={getBadgeIcon}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>

        {badges.all_badges.length === 0 && (
          <div className="text-center py-8">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No badges yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Complete orders and receive reviews to start earning badges!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Badge Card Component
const BadgeCard = ({ 
  badge, 
  isPinned, 
  onTogglePin, 
  onDownload, 
  actionLoading, 
  getBadgeRarityStyle,
  getBadgeIcon
}) => {
  const IconComponent = getBadgeIcon(badge.badge_type.category);
  const rarityStyle = getBadgeRarityStyle(badge.badge_type.rarity);

  return (
    <div className={`border-2 rounded-lg p-4 ${rarityStyle} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <IconComponent className="w-6 h-6 mr-2" />
          <div>
            <h5 className="font-medium text-sm line-clamp-1">{badge.badge_type.name}</h5>
            <p className="text-xs opacity-75 capitalize">{badge.badge_type.rarity}</p>
          </div>
        </div>
        {isPinned && (
          <Pin className="w-4 h-4 text-blue-600" />
        )}
      </div>
      
      <p className="text-xs mb-3 line-clamp-2">{badge.badge_type.description}</p>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        Earned: {badge.earned_date_formatted}
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onTogglePin(badge.id, isPinned)}
          disabled={actionLoading[badge.id] || (!isPinned && badge.is_pinned === false && onTogglePin === null)}
          className={`flex-1 px-3 py-1 text-xs rounded transition-colors ${
            isPinned
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          } disabled:opacity-50`}
        >
          {actionLoading[badge.id] ? (
            'Loading...'
          ) : isPinned ? (
            <>
              <PinOff className="w-3 h-3 inline mr-1" />
              Unpin
            </>
          ) : (
            <>
              <Pin className="w-3 h-3 inline mr-1" />
              Pin
            </>
          )}
        </button>
        
        <button
          onClick={() => onDownload(badge.id)}
          disabled={actionLoading[`download_${badge.id}`]}
          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
        >
          {actionLoading[`download_${badge.id}`] ? (
            'Loading...'
          ) : (
            <>
              <Download className="w-3 h-3 inline mr-1" />
              Download
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProviderBadgesManagement;