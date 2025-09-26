// src/pages/wowFactors/digitalGarden/MilestoneProgress.jsx
import React from 'react';
import { TrophyIcon, PackageIcon, BuildingIcon, CoinsIcon } from 'lucide-react';
import ProgressBar from '../../../components/ui/ProgressBar';

const MilestoneProgress = ({ stats, className = "" }) => {
  if (!stats) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getMilestoneIcon = (type) => {
    switch (type) {
      case 'order_count':
        return <PackageIcon className="w-5 h-5" />;
      case 'order_amount':
        return <CoinsIcon className="w-5 h-5" />;
      case 'business_count':
        return <BuildingIcon className="w-5 h-5" />;
      default:
        return <TrophyIcon className="w-5 h-5" />;
    }
  };

  const getMilestoneColor = (type) => {
    switch (type) {
      case 'order_count':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'order_amount':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300';
      case 'business_count':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getProgressVariant = (type) => {
    switch (type) {
      case 'order_count':
        return 'info';
      case 'order_amount':
        return 'garden';
      case 'business_count':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const formatMilestoneTitle = (type) => {
    switch (type) {
      case 'order_count':
        return 'Order Milestones';
      case 'order_amount':
        return 'Spending Milestones';
      case 'business_count':
        return 'Business Diversity';
      default:
        return 'Milestones';
    }
  };

  const getRewardDescription = (type, target) => {
    const rewards = {
      order_count: {
        1: 'Uncommon plant',
        3: 'Uncommon plant',
        5: 'Rare plant',
        10: 'Rare plant',
        15: 'Epic plant',
        20: 'Epic plant',
        25: 'Legendary plant'
      },
      order_amount: {
        150: 'Uncommon plant',
        200: 'Uncommon plant',
        300: 'Rare plant',
        500: 'Epic plant',
        1000: 'Legendary plant'
      },
      business_count: {
        5: 'Rare plant',
        10: 'Epic plant',
        15: 'Epic plant',
        20: 'Legendary plant'
      }
    };

    return rewards[type]?.[target] || 'Special plant';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-center space-x-2 mb-6">
        <TrophyIcon className="w-6 h-6 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Milestone Progress
        </h3>
      </div>

      {/* Current stats overview */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.total_orders}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Orders
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            R{parseFloat(stats.total_order_amount || 0).toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Spent
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.unique_businesses_ordered_from}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Businesses
          </div>
        </div>
      </div>

      {/* Next milestones */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Next Rewards:
        </h4>
        
        {stats.next_milestones && stats.next_milestones.length > 0 ? (
          stats.next_milestones.slice(0, 3).map((milestone, index) => {
            const progressPercentage = (milestone.current / milestone.target) * 100;
            const milestoneColor = getMilestoneColor(milestone.type);
            const progressVariant = getProgressVariant(milestone.type);
            
            return (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                {/* Milestone header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${milestoneColor}`}>
                      {getMilestoneIcon(milestone.type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {formatMilestoneTitle(milestone.type)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Reward: {getRewardDescription(milestone.type, milestone.target)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {milestone.current}/{milestone.target}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {milestone.remaining} to go
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <ProgressBar
                  progress={progressPercentage}
                  variant={progressVariant}
                  size="small"
                  className="mb-2"
                />

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {milestone.description}
                </p>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <TrophyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              All milestones completed! 🎉
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Keep ordering to earn more plants
            </p>
          </div>
        )}
      </div>

      {/* Achievement summary */}
      {stats.achieved_milestones && Object.keys(stats.achieved_milestones).length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Achievements Unlocked:
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.achieved_milestones).map(([type, achievements]) => (
              achievements.length > 0 && (
                <div key={type} className="flex items-center space-x-1">
                  <div className={`p-1 rounded ${getMilestoneColor(type)}`}>
                    {getMilestoneIcon(type)}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {achievements.length}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for smaller spaces
export const CompactMilestoneProgress = ({ stats, className = "" }) => {
  if (!stats?.next_milestones?.length) {
    return null;
  }

  const nextMilestone = stats.next_milestones[0];
  const progressPercentage = (nextMilestone.current / nextMilestone.target) * 100;

  return (
    <div className={`bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-4 text-white ${className}`}>
      <div className="flex items-center space-x-3">
        <TrophyIcon className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            Next Milestone
          </div>
          <div className="text-xs opacity-90 truncate">
            {nextMilestone.description}
          </div>
          
          {/* Mini progress bar */}
          <div className="mt-2 bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs opacity-90">
              {nextMilestone.current}/{nextMilestone.target}
            </span>
            <span className="text-xs opacity-90">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneProgress;