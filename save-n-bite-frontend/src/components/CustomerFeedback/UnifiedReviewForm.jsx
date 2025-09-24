import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { XIcon, Star, ChevronLeft } from 'lucide-react'
import { useParams } from 'react-router-dom'
import StarRating from './StarRating'
import reviewsAPI from '../../services/reviewsAPI'

const UnifiedReviewForm = ({ providerName, onClose, onComplete, orderData, source = "popup" }) => {
  const { orderId } = useParams()
  const [providerRating, setProviderRating] = useState(0)
  const [providerComment, setProviderComment] = useState('')
  const [itemRating, setItemRating] = useState(0)
  const [itemComment, setItemComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSubmit = async () => {
    if (providerRating === 0 && itemRating === 0 && providerComment.trim() === "" && itemComment.trim() === "") {
      setModalMessage("Please provide at least one rating or comment before submitting.")
      setIsModalOpen(true)
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        interaction_id: orderId,
        general_rating: Math.max(providerRating, itemRating) || 0,
        general_comment: [providerComment.trim(), itemComment.trim()].filter(Boolean).join(" | ") || "",
        business_review: providerComment.trim() || "",
        food_review: itemComment.trim() || "",
        review_source: source
      }

      const response = await reviewsAPI.createReview(payload)
      if (response?.data?.review || response?.success) {
        onComplete()
      } else {
        setModalMessage(response?.data?.error?.message || response?.data?.message || "An error occurred while submitting your review.")
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error("Review submission error:", error)
      setModalMessage("Failed to submit review. Please try again later.")
      setIsModalOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto"
    >
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <ChevronLeft size={24} className="text-gray-600 dark:text-gray-300" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Write a Review</h2>
            <div className="w-10"></div> {/* Spacer for alignment */}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-8">
          {/* Provider Review Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Food Provider Experience
              </h3>
              <StarRating 
                rating={providerRating} 
                setRating={setProviderRating} 
                size={24}
                className="ml-4"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How was your experience with {providerName || 'this provider'}?
            </p>
            <textarea
              placeholder="Share your experience with the provider (service, staff, location, etc.)"
              value={providerComment}
              onChange={(e) => setProviderComment(e.target.value)}
              className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl resize-none h-32 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
              rows={4}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800 my-6"></div>

          {/* Item Review Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Food Quality
              </h3>
              <StarRating 
                rating={itemRating} 
                setRating={setItemRating} 
                size={24}
                className="ml-4"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How was the quality and taste of the food?
            </p>
            <textarea
              placeholder="Tell us about the food quality, taste, freshness, portion size, etc."
              value={itemComment}
              onChange={(e) => setItemComment(e.target.value)}
              className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl resize-none h-32 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200"
              rows={4}
            />
          </div>

          {/* Helper Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4">
            Your feedback helps us improve our service. At least one rating or comment is required.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 sticky bottom-0">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (providerRating === 0 && itemRating === 0 && providerComment.trim() === '' && itemComment.trim() === '')}
            className={`w-full py-3 px-6 rounded-xl font-medium text-white transition-colors ${
              (providerRating > 0 || itemRating > 0 || providerComment.trim() !== '' || itemComment.trim() !== '') && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <XIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {modalMessage.includes("error") ? "Error" : "Missing Information"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {modalMessage}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default UnifiedReviewForm