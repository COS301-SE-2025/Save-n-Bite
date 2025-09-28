import React from 'react'
import { EyeIcon, FlagIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'

const ReviewTable = ({ reviews, onViewReview, onActionClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'flagged':
        return 'bg-amber-100 text-amber-800'
      case 'censored':
        return 'bg-blue-100 text-blue-800'
      case 'deleted':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'flagged':
        return 'Flagged'
      case 'censored':
        return 'Censored'
      case 'deleted':
        return 'Deleted'
      default:
        return status
    }
  }

  const renderStars = (rating) => {
    // Handle null/undefined rating
    const validRating = rating || 0;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= validRating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-500">({validRating})</span>
      </div>
    )
  }

  // Safe accessor function to handle missing nested properties
  const safeGet = (obj, path, defaultValue = 'N/A') => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
  }

  // Get review content with fallback
  const getReviewContent = (review) => {
    return review.general_comment || 
           review.food_review || 
           review.business_review || 
           'No written review';
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reviewer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Review Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {/* FIXED: Safe access to reviewer name */}
                      {safeGet(review, 'reviewer.name', 'Anonymous')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {/* FIXED: Format date properly */}
                      {review.time_ago || 
                       (review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Unknown date')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {/* FIXED: Changed from review.subject.name to review.business.business_name */}
                      {safeGet(review, 'business.business_name', 'Unknown Business')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {/* FIXED: Get user type from reviewer, not subject */}
                      {safeGet(review, 'reviewer.user_type', 'customer').charAt(0).toUpperCase() + 
                       safeGet(review, 'reviewer.user_type', 'customer').slice(1)} Review
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* FIXED: Handle null rating */}
                    {renderStars(review.general_rating)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {/* FIXED: Get content from correct fields */}
                      {getReviewContent(review)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}
                    >
                      {getStatusDisplay(review.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewReview(review)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View Details"
                    >
                      <EyeIcon size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No reviews found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReviewTable