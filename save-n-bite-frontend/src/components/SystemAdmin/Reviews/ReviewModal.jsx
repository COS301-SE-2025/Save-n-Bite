import React from 'react'
import { XIcon, FlagIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'

const ReviewModal = ({
  review,
  onClose,
  onApprove,
  onRemove,
  onFlag,
}) => {
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
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
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    Review Details
                    {review.flagged && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        <FlagIcon size={12} className="mr-1" />
                        Flagged
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Review ID
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">{review.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Reviewer
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {review.reviewer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.reviewer.id}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Subject
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {review.subject.name}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${review.subject.type === 'Provider' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}
                        >
                          {review.subject.type}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Rating
                    </h4>
                    <div className="mt-1">{renderStars(review.rating)}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Review Content
                    </h4>
                    <div className="mt-1 bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-900">{review.content}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Date Posted
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(review.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Status
                      </h4>
                      <p className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.status === 'Published' ? 'bg-green-100 text-green-800' : review.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {review.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  {review.flagged && review.flagReason && (
                    <div className="bg-red-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-red-800">
                        Flag Reason
                      </h4>
                      <p className="mt-1 text-sm text-red-700">
                        {review.flagReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {review.status === 'Under Review' && (
              <button
                type="button"
                onClick={() => onApprove(review.id)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <CheckCircleIcon size={16} className="mr-2" />
                Approve
              </button>
            )}
            {review.status !== 'Removed' && (
              <button
                type="button"
                onClick={() => onRemove(review.id)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <XCircleIcon size={16} className="mr-2" />
                Remove
              </button>
            )}
            {!review.flagged && review.status === 'Published' && (
              <button
                type="button"
                onClick={() => onFlag(review.id)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <FlagIcon size={16} className="mr-2" />
                Flag
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
