import React from 'react';
import {
  Star as StarIcon,
  Users as UsersIcon,
  MessageCircle as MessageIcon,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function BusinessFeedback({ data }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-300">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Business Feedback Overview
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl font-bold text-gray-900">
                {data.averageRating}
              </span>
              <StarIcon className="h-6 w-6 text-yellow-400 fill-current" />
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <MessageIcon className="h-6 w-6 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">
                {data.totalReviews}
              </span>
            </div>
            <p className="text-sm text-gray-500">Total Reviews</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <UsersIcon className="h-6 w-6 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">
                {data.followers}
              </span>
            </div>
            <p className="text-sm text-gray-500">Followers</p>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rating Distribution
          </h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ratingDistribution}>
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Recent Highlight
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-100 mb-2">
            "{data.recentHighlight.comment}"
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300">
            - {data.recentHighlight.author} •{' '}
            {new Date(data.recentHighlight.date).toLocaleDateString()}
          </p>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          This rating appears on your public profile
        </p>
      </div>
    </div>
  );
}
