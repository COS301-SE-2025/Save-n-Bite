import React, { useState } from 'react'
import { XIcon, FlagIcon, XCircleIcon } from 'lucide-react'

const ReviewModal = ({ review, onClose, onFlag, onDelete }) => {
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [showDeleteForm, setShowDeleteForm] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [deleteReason, setDeleteReason] = useState('')

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
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-lg font-medium text-gray-700">({rating}/5)</span>
      </div>
    )
  }

  const handleFlag = () => {
    if (showFlagForm) {
      if (!flagReason.trim()) {
        alert('Please provide a reason for flagging this review')
        return
      }
      onFlag(review.id, flagReason)
      setFlagReason('')
      setShowFlagForm(false)
    } else {
      setShowFlagForm(true)
    }
  }

  const handleDelete = () => {
    if (showDeleteForm) {
      if (!deleteReason.trim()) {
        alert('Please provide a reason for deleting this review')
        return
      }
      onDelete(review.id, deleteReason)
      setDeleteReason('')
      setShowDeleteForm(false)
    } else {
      setShowDeleteForm(true)
    }
  }

  const handleCancelFlag = () => {
    setShowFlagForm(false)
    setFlagReason('')
  }

  const handleCancelDelete = () => {
    setShowDeleteForm(false)
    setDeleteReason('')
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
            <div className="flex items-start justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Review Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon size={24} />
              </button>
            </div>
            <div className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Reviewer</h4>
                    <p className="mt-1 text-sm text-gray-900">{review.reviewer.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Subject</h4>
                    <p className="mt-1 text-sm text-gray-900">{review.subject.name}</p>
                    <p className="text-xs text-gray-500">{review.subject.type}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Date</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(review.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}
                      >
                        {getStatusDisplay(review.status)}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Rating</h4>
                  <div className="mt-1">
                    {renderStars(review.rating)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Review Content</h4>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900">{review.content}</p>
                  </div>
                </div>

                {(review.status === 'flagged' || review.status === 'deleted') && review.reason && (
                  <div className={`p-3 rounded-md ${review.status === 'flagged' ? 'bg-amber-50' : 'bg-red-50'}`}>
                    <h4 className={`text-sm font-medium ${review.status === 'flagged' ? 'text-amber-800' : 'text-red-800'}`}>
                      {review.status === 'flagged' ? 'Flag Reason' : 'Deletion Reason'}
                    </h4>
                    <p className={`mt-1 text-sm ${review.status === 'flagged' ? 'text-amber-700' : 'text-red-700'}`}>
                      {review.reason}
                    </p>
                  </div>
                )}

                {showFlagForm && (
                  <div>
                    <label
                      htmlFor="flag-reason"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Flag Reason *
                    </label>
                    <textarea
                      id="flag-reason"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      placeholder="Please provide a reason for flagging this review..."
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                )}

                {showDeleteForm && (
                  <div>
                    <label
                      htmlFor="delete-reason"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Deletion Reason *
                    </label>
                    <textarea
                      id="delete-reason"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Please provide a reason for deleting this review..."
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {review.status !== 'deleted' && (
              <>
                {!showFlagForm && !showDeleteForm ? (
                  <>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={handleFlag}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Flag
                    </button>
                  </>
                ) : showFlagForm ? (
                  <>
                    <button
                      type="button"
                      onClick={handleFlag}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Confirm Flag
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelFlag}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Confirm Deletion
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
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