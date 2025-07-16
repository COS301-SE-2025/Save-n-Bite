import React from 'react'
import { EyeIcon, FlagIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'

const ReviewTable = ({
  reviews,
  onViewReview,
  onActionClick,
}) => {
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 15.585l-5.196 2.73 0.992-5.784-4.204-4.098 5.809-0.844 2.599-5.269 2.599 5.269 5.809 0.844-4.204 4.098 0.992 5.784z"
              clipRule="evenodd"
            />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating}</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Reviewer
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Subject
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rating
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
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
                      {review.reviewer.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {review.reviewer.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {review.subject.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${review.subject.type === 'Provider' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {review.subject.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStars(review.rating)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(review.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.status === 'Published' ? 'bg-green-100 text-green-800' : review.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {review.status}
                      </span>
                      {review.flagged && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <FlagIcon size={12} className="mr-1" />
                          Flagged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewReview(review)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="View Details"
                    >
                      <EyeIcon size={18} />
                    </button>
                    {review.status === 'Under Review' && (
                      <button
                        onClick={() => onActionClick('approve', review.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Approve Review"
                      >
                        <CheckCircleIcon size={18} />
                      </button>
                    )}
                    {review.status !== 'Removed' && (
                      <button
                        onClick={() => onActionClick('remove', review.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove Review"
                      >
                        <XCircleIcon size={18} />
                      </button>
                    )}
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
