import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ArrowLeft, Star } from 'lucide-react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import StarRating from '../../components/CustomerFeedback/StarRating'
import UnifiedReviewForm from '../../components/CustomerFeedback/UnifiedReviewForm'
import reviewsAPI from '../../services/reviewsAPI'

const ReviewPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [interaction, setInteraction] = useState(null)
  const [reviewStatus, setReviewStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showUnifiedReview, setShowUnifiedReview] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    loadInteractionData()
  }, [orderId])

  const loadInteractionData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const reviewResponse = await reviewsAPI.checkReviewStatus(orderId)
      if (reviewResponse.success) {
        setReviewStatus(reviewResponse.data)
        if (reviewResponse.data.has_review) {
          setIsComplete(true)
        }
      }
    } catch (error) {
      console.error('Error loading interaction data:', error)
      setError('Failed to load interaction details')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewComplete = () => {
    setShowUnifiedReview(false)
    setIsComplete(true)
    setTimeout(() => {
      navigate('/orders')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-sm text-gray-600 dark:text-gray-200">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium">Error loading order</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
      <CustomerNavBar />
      
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors mb-3 text-sm"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to orders</span>
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {isComplete ? 'Review Submitted' : 'Leave a Review'}
            </h1>
            {isComplete && (
              <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
          </div>
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isComplete 
              ? 'Thank you for your feedback!' 
              : 'Share your experience with us'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 text-center"
            >
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Review Submitted!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                Thank you for sharing your experience.
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
              >
                Back to Orders
              </button>
            </motion.div>
          ) : showUnifiedReview ? (
            <UnifiedReviewForm
              providerName={interaction?.business?.name || 'the restaurant'}
              onClose={() => setShowUnifiedReview(false)}
              onComplete={handleReviewComplete}
              orderData={interaction}
            />
          ) : (
            <motion.div
              key="review-prompt"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="text-center">
                  <div className="mx-auto h-20 w-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                    <Star className="h-9 w-9 text-emerald-500" fill="currentColor" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    How was your experience?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Your feedback helps us improve our service and ensure the best experience for everyone.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-6">
                    <button
                      onClick={() => setShowUnifiedReview(true)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-base flex items-center justify-center space-x-2"
                    >
                      <span>Write a Review</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigate('/orders')}
                      className="w-full py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ReviewPage