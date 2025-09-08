// File: src/components/CustomerFeedback/UnifiedReviewForm.js
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { XIcon } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import StarRating from './StarRating'
import reviewsAPI from '../../services/reviewsAPI'

const UnifiedReviewForm = ({ providerName, onClose, onComplete, orderData }) => {
  const { orderId } = useParams()
  const [providerRating, setProviderRating] = useState(0)
  const [providerComment, setProviderComment] = useState('')
  const [itemRating, setItemRating] = useState(0)
  const [itemComment, setItemComment] = useState('')
  const [overallRating, setOverallRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate overall rating based on provider and item ratings
  React.useEffect(() => {
    if (providerRating > 0 && itemRating > 0) {
      setOverallRating(Math.round((providerRating + itemRating) / 2))
    } else if (providerRating > 0 || itemRating > 0) {
      setOverallRating(providerRating || itemRating)
    } else {
      setOverallRating(0)
    }
  }, [providerRating, itemRating])

  const handleSubmit = async () => {
    // Require at least one rating and comment
    if ((providerRating === 0 && itemRating === 0) || 
        (providerComment.trim() === '' && itemComment.trim() === '')) {
      return
    }

    setIsSubmitting(true)

    try {
      // Create the payload exactly like your working components
      const payload = {
        interaction_id: orderId,
        general_rating: overallRating || Math.max(providerRating, itemRating), // Fallback calculation
        general_comment: [providerComment.trim(), itemComment.trim()]
          .filter(comment => comment.length > 0)
          .join(' | ') || 'Review submitted',
        business_review: providerComment.trim() || '',
        food_review: itemComment.trim() || '',
        review_source: 'unified_form'
      }

      console.log('Submitting review with payload:', payload)
      console.log('Order ID:', orderId, 'Type:', typeof orderId)

      const response = await reviewsAPI.createReview(payload)
      
      console.log('Full API response:', response)

      if (response && response.success) {
        console.log('Review submitted successfully!')
        onComplete()
      } else {
        console.error('API returned error:', response)
        const errorMsg = response?.error || response?.message || 'Unknown error occurred'
        alert('Failed to submit review: ' + errorMsg)
      }
    } catch (error) {
      console.error('Exception during review submission:', error)
      
      // Log detailed error information
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
        console.error('Response headers:', error.response.headers)
      } else if (error.request) {
        console.error('No response received:', error.request)
      } else {
        console.error('Error setting up request:', error.message)
      }
      
      // Show user-friendly error message
      let errorMessage = 'Failed to submit review. '
      if (error.response?.status === 400) {
        const errorData = error.response.data
        if (errorData?.message) {
          errorMessage += errorData.message
        } else if (errorData?.error) {
          errorMessage += errorData.error
        } else if (errorData?.detail) {
          errorMessage += errorData.detail
        } else {
          errorMessage += 'Invalid data sent to server. Check console for details.'
        }
      } else if (error.response?.status === 401) {
        errorMessage += 'You need to be logged in to submit a review.'
      } else if (error.response?.status === 403) {
        errorMessage += 'You do not have permission to review this order.'
      } else if (error.response?.status === 404) {
        errorMessage += 'Order not found or cannot be reviewed.'
      } else {
        errorMessage += error.message || 'Please try again.'
      }
      
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return (providerRating > 0 || itemRating > 0) && 
           (providerComment.trim() !== '' || itemComment.trim() !== '')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white dark:bg-gray-900 rounded-xl transition-colors duration-300 overflow-y-auto"
    >
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Review Your Experience
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Overall Rating Display */}
        {/* {overallRating > 0 && (
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Rating</p>
            <div className="flex justify-center">
              <StarRating rating={overallRating} setRating={() => {}} size={28} />
            </div>
          </div>
        )} */}

        {/* Provider Review Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🏪</div>
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">
              Food Provider Experience
            </h4>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            How was your experience with {providerName || 'this provider'}?
          </p>
          
          <div className="flex justify-center">
            <StarRating rating={providerRating} setRating={setProviderRating} />
          </div>
          
          <textarea
            placeholder="Share your experience with the provider (service, staff, location, etc.)"
            value={providerComment}
            onChange={(e) => setProviderComment(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Item Review Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🍽️</div>
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">
              Food Quality
            </h4>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            How was the quality and taste of the food?
          </p>
          
          <div className="flex justify-center">
            <StarRating rating={itemRating} setRating={setItemRating} />
          </div>
          
          <textarea
            placeholder="Tell us about the food quality, taste, freshness, portion size, etc."
            value={itemComment}
            onChange={(e) => setItemComment(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
          />
        </div>

        {/* Helper Text */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          You can review just the provider, just the food, or both. At least one rating and comment is required.
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="px-6 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default UnifiedReviewForm