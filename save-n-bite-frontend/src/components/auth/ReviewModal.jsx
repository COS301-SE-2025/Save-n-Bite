import React from 'react'
import { XIcon, StarIcon, ThumbsUpIcon } from 'lucide-react'

const ReviewsModal = ({
  isOpen,
  onClose,
  providerName,
  providerRating,
  totalReviews,
  reviews,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Reviews for {providerName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="flex items-center text-amber-500">
              <StarIcon size={24} className="fill-current" />
              <span className="ml-2 text-2xl font-bold">{providerRating}</span>
            </div>
            <div className="text-gray-600">Based on {totalReviews} reviews</div>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow">
          {reviews.length > 0 ? (
            <div className="divide-y">
              {reviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      {/* <img
                        src={review.userImage}
                        alt={review.userName}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      /> */}
                      <div>
                        <p className="font-medium text-gray-800">
                          {review.userName}
                        </p>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          size={16}
                          className={
                            i < review.rating
                              ? 'fill-current'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                  {/* <div className="mt-4 flex items-center">
                    <button
                      className={`flex items-center text-sm ${
                        review.isHelpful
                          ? 'text-emerald-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ThumbsUpIcon size={14} className="mr-1" />
                      Helpful ({review.helpful})
                    </button>
                  </div> */}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600">No reviews yet for this provider.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReviewsModal
