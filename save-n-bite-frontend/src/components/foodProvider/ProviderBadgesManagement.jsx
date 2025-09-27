// src/components/foodProvider/ProviderBadgesManagement.jsx
import React, { useState, useEffect } from 'react';
import { Download, Pin, PinOff, Star, Award, Trophy, Crown, Target, CheckCircle } from 'lucide-react';
import badgesAPI from '../../services/badgesAPI';
import BadgeSVG from '../badges/BadgeSVG';

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
    // eslint-disable-next-line
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

  const getRarityStyles = (rarity) => {
    const styles = {
      common: {
        gradient: 'from-gray-50 to-gray-100',
        border: 'border-gray-200',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-700'
      },
      uncommon: {
        gradient: 'from-green-50 to-green-100',
        border: 'border-green-200',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-700'
      },
      rare: {
        gradient: 'from-blue-50 to-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700'
      },
      epic: {
        gradient: 'from-purple-50 to-purple-100',
        border: 'border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-700'
      },
      legendary: {
        gradient: 'from-yellow-50 to-yellow-100',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-700'
      }
    };
    return styles[rarity] || styles.common;
  };

  const getCategoryBadges = (category) => {
    return badges.all_badges.filter(badge => badge.badge_type.category === category);
  };

  const getBadgeIcon = (category, rarity) => {
    // fallback to lucide icons if BadgeSVG is not used
    const getRarityColor = (rarity) => {
      const colors = {
        common: '#6B7280',
        uncommon: '#10B981',
        rare: '#3B82F6',
        epic: '#8B5CF6',
        legendary: '#F59E0B'
      };
      return colors[rarity] || colors.common;
    };
    const color = getRarityColor(rarity);
    const icons = {
      performance: <Trophy color={color} className="w-6 h-6" />,
      milestone: <Target color={color} className="w-6 h-6" />,
      recognition: <Star color={color} className="w-6 h-6" />,
      monthly: <Crown color={color} className="w-6 h-6" />,
      special: <Award color={color} className="w-6 h-6" />
    };
    return icons[category] || <Award color={color} className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
        <div className="text-center text-red-600 dark:text-red-400">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">Failed to load badges: {error}</p>
          <button
            onClick={loadBadges}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const categories = [
    { key: 'performance', name: 'Performance', description: 'Competition & ranking badges', icon: Trophy },
    { key: 'milestone', name: 'Milestone', description: 'Achievement milestones', icon: Target },
    { key: 'recognition', name: 'Recognition', description: 'Quality & excellence', icon: Star },
    { key: 'monthly', name: 'Monthly', description: 'Monthly achievements', icon: Crown },
    { key: 'special', name: 'Special', description: 'Special events & recognition', icon: Award }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Your Achievement Badges
        </h3>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 p-4 rounded-xl text-center border border-emerald-200 dark:border-emerald-700">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                {stats.total_badges}
              </div>
              <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Badges</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-xl text-center border border-blue-200 dark:border-blue-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                {stats.pinned_badges_count}
              </div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Pinned</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-xl text-center border border-purple-200 dark:border-purple-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                {stats.rare_badges + stats.epic_badges + stats.legendary_badges}
              </div>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-400">Rare+</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 p-4 rounded-xl text-center border border-yellow-200 dark:border-yellow-700">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300">
                {stats.rarity_score}
              </div>
              <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Score</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl text-center border border-gray-200 dark:border-gray-600">
              <div className="text-xl font-bold text-gray-600 dark:text-gray-300">
                {badges.pinned_badges.length}/5
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-400">Pin Slots</div>
            </div>
          </div>
        )}

        {/* Pinned Badges Section */}
        {badges.pinned_badges.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <Pin className="w-5 h-5 mr-2 text-emerald-600" />
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
                  getRarityStyles={getRarityStyles}
                  getBadgeIcon={getBadgeIcon}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Badges by Category */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryBadges = getCategoryBadges(category.key);
            if (categoryBadges.length === 0) return null;

            const IconComponent = category.icon;

            return (
              <div key={category.key}>
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg mr-3">
                    <IconComponent className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {category.name} ({categoryBadges.length})
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </div>
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
                        getRarityStyles={getRarityStyles}
                        getBadgeIcon={getBadgeIcon}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>

        {badges.all_badges.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No badges earned yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Complete orders and receive reviews to start earning badges! Your first badge is just one order away.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Badge Card Component (smaller badge image)
const BadgeCard = ({
  badge,
  isPinned,
  onTogglePin,
  onDownload,
  actionLoading,
  getRarityStyles,
  getBadgeIcon
}) => {
  const rarityStyles = getRarityStyles(badge.badge_type.rarity);
  const category = badge.badge_type.category;
  const rarity = badge.badge_type.rarity;

  return (
    <div className={`relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-lg`} style={{ minHeight: 220 }}>
      {/* Rarity Pill */}
      <span
        className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold shadow bg-gray-100 dark:bg-gray-800 ${rarityStyles.text}`}
        style={{ letterSpacing: 1 }}
      >
        {badge.badge_type.rarity_display || badge.badge_type.rarity}
      </span>

      {/* Pin indicator */}
      {isPinned && (
        <div className="absolute top-4 right-4">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow">
            <Pin className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Badge SVG or fallback icon */}
      <div className="flex justify-center items-center mt-8 mb-2">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-inner">
          <BadgeSVG badge={badge} className="w-12 h-12" />
        </div>
      </div>

      {/* Badge Title */}
      <div className="flex flex-col items-center px-4">
        <h5 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-1 text-center truncate w-full">
          {badge.badge_type.name}
        </h5>
        <p className="text-xs text-gray-600 dark:text-gray-300 text-center mb-2 min-h-[32px]">
          {badge.badge_type.description}
        </p>
      </div>

      {/* Earned Date */}
      <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 mb-2 mt-auto px-4">
        <CheckCircle className="w-3 h-3 mr-1" />
        Earned: {badge.earned_date_formatted}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={() => onTogglePin(badge.id, isPinned)}
          disabled={actionLoading[badge.id]}
          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${isPinned
            ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:hover:bg-emerald-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {actionLoading[badge.id] ? (
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
              Loading...
            </div>
          ) : isPinned ? (
            <div className="flex items-center justify-center">
              <PinOff className="w-3 h-3 mr-1" />
              Unpin
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Pin className="w-3 h-3 mr-1" />
              Pin
            </div>
          )}
        </button>
        <button
          onClick={() => onDownload(badge.id)}
          disabled={actionLoading[`download_${badge.id}`]}
          className="flex-1 px-3 py-2 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 
            dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors 
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading[`download_${badge.id}`] ? (
            <div className="flex items-center">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
              Loading...
            </div>
          ) : (
            <div className="flex items-center">
              <Download className="w-3 h-3 mr-1" />
              Download
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProviderBadgesManagement;