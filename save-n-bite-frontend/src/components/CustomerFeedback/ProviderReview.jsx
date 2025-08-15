import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { XIcon } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import StarRating from './StarRating'
import reviewsAPI from '../../services/reviewsAPI'

const ProviderReview = ({ providerName, onClose, onComplete, orderData }) => {
  const { orderId } = useParams() 
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (comment.trim() === '' || rating === 0) return
    
    setIsSubmitting(true)
    
    try {
      const response = await reviewsAPI.createReview({
        interaction_id: orderId, // Use the real interaction ID
        general_rating: rating,
        general_comment: comment,
        business_review: comment, // Use the same comment for business review
        food_review: '', // Empty for provider-focused review
        review_source: 'popup'
      })

      if (response.success) {
        onComplete();
      } else {
        alert('Failed to submit review: ' + response.error);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white dark:bg-gray-900 rounded-xl transition-colors duration-300"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Review Food Provider
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
          >
            <XIcon size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="font-medium text-gray-700 dark:text-gray-300">Rate your experience</p>
          <div className="flex justify-center">
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <textarea
            placeholder="Share your experience with this provider."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={comment.trim() === '' || rating === 0 || isSubmitting}
            className="px-6 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default ProviderReview