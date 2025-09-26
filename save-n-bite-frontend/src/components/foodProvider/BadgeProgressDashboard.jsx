// src/components/foodProvider/BadgeProgressDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Award, Target, TrendingUp, Star, CheckCircle } from 'lucide-react';
import badgesAPI from '../../services/badgesAPI';

const BadgeProgressDashboard = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBadgeProgress();
  }, []);

  const loadBadgeProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await badgesAPI.getBadgeProgress();
      setProgressData(response);
    } catch (err) {
      console.error('Error loading badge progress:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getProgressTextColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (percentage >= 25) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
        <div className="text-center">
          <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-red-600 dark:text-red-400 text-sm">
            Failed to load badge progress
          </p>
          <button 
            onClick={loadBadgeProgress}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!progressData) return null;

  const { provider_stats, milestone_progress, next_achievable_badges } = progressData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-5 transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
          Badge Progress
        </h3>
        <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>

      {/* Provider Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {provider_stats.total_orders}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">Orders</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {provider_stats.total_reviews}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">Reviews</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {provider_stats.average_rating.toFixed(1)}★
          </div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">Rating</div>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Milestone Progress
        </h4>
        
        {milestone_progress.slice(0, 4).map((milestone, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {milestone.is_earned ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Award className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  milestone.is_earned 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {milestone.badge_name}
                </span>
              </div>
              <span className={`text-xs ${getProgressTextColor(milestone.progress_percentage)}`}>
                {milestone.current_value}/{milestone.target_value}
              </span>
            </div>
            
            {!milestone.is_earned && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(milestone.progress_percentage)}`}
                  style={{ width: `${Math.min(milestone.progress_percentage, 100)}%` }}
                ></div>
              </div>
            )}
            
            {milestone.additional_requirement && (
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                {milestone.additional_requirement}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Next Achievable Badges */}
      {next_achievable_badges.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Almost There!
            </h4>
          </div>
          <div className="space-y-2">
            {next_achievable_badges.slice(0, 2).map((badge, index) => (
              <div key={index} className="bg-green-50 dark:bg-green-900 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {badge.badge_name}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {badge.progress_percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-1.5">
                  <div 
                    className="h-1.5 bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(badge.progress_percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Need {badge.target_value - badge.current_value} more to unlock
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg">
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Keep up the great work! Complete more orders and gather reviews to unlock new badges.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BadgeProgressDashboard;