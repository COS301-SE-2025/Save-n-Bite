import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XIcon, ArrowLeftIcon } from 'lucide-react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import StarRating from '../../components/CustomerFeedback/StarRating'
import ProviderReview from '../../components/CustomerFeedback/ProviderReview'
import ItemReview from '../../components/CustomerFeedback/ItemReview'
import reviewsAPI from '../../services/reviewsAPI'
import UnifiedReviewForm from '../../components/CustomerFeedback/UnifiedReviewForm'

const ReviewPage = () => {
  const { orderId } = useParams() // This is actually the interaction ID from our order history
  const navigate = useNavigate()
  const [interaction, setInteraction] = useState(null)
  const [reviewStatus, setReviewStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)
  // const [showProviderReview, setShowProviderReview] = useState(false)
  // const [showItemReview, setShowItemReview] = useState(false)
  const [showUnifiedReview, setShowUnifiedReview] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    loadInteractionData()
  }, [orderId])

  const loadInteractionData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get interaction details
   
        
        // Check review status
        const reviewResponse = await reviewsAPI.checkReviewStatus(orderId)
        if (reviewResponse.success) {
          setReviewStatus(reviewResponse.data)
          
          // If already reviewed, show completion immediately
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

  const handleSkip = () => {
    // setIsComplete(true)
    setTimeout(() => {
      navigate('/orders')
    }, 2000)
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-200">Loading interaction details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error ) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error || 'Interaction not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  // Transform interaction data to match existing review component expectations
  const orderData = {
    // id: interaction.id,
    // orderNumber: `#${interaction.id.split('-')[0]}`, // Generate order number from ID
    // items: interaction.items ? interaction.items.map(item => item.name) : ['Food Items'],
    // provider: interaction.business?.name || 'Unknown Business',
    // status: interaction.status,
    // date: interaction.created_at,
    // total: interaction.order?.total_amount || '0.00',
    // pickupTime: interaction.pickup_details?.scheduled_time || null,
    // pickupAddress: interaction.business?.address || 'Pickup Location',
    // Add interaction ID for review API calls
    interactionId: orderId
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
      <CustomerNavBar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Review Your Order
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          {/* Interaction Details */}
          {/* <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Order Details</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p><strong>Business:</strong> {interaction.business?.name}</p>
              <p><strong>Type:</strong> {interaction.type}</p>
              <p><strong>Items:</strong> {interaction.items_count || 1} item(s)</p>
              <p><strong>Amount:</strong> {interaction.order?.total_amount ? `R${interaction.order.total_amount}` : 'Free'}</p>
              <p><strong>Date:</strong> {new Date(interaction.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {interaction.status}</p>
            </div>
          </div> */}

          <AnimatePresence mode="wait">
            {step === 1 && !isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {reviewStatus?.has_review ? (
                  <div className="text-center space-y-4">
                    <CheckCircleIcon size={48} className="text-green-500 mx-auto" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      Review Already Submitted
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Thank you for your feedback on this order!
                    </p>
                  </div>
                ) : reviewStatus?.can_review ? (
                  <>
                  
                    <div className="text-center space-y-2 ">
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        Your feedback helps us and our providers improve.
                      </h2>
                      {/* <p className="text-gray-600 dark:text-gray-300">
                        Order from 
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your feedback helps us and our providers improve.
                      </p> */}
                    </div>

                    {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setShowProviderReview(true)}
                        className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">🏪</div>
                        <h3 className="font-medium mb-1">Review Food Provider</h3>
                      </button>
                      <button
                        onClick={() => setShowItemReview(true)}
                        className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">🍽️</div>
                        <h3 className="font-medium mb-1">Review Items</h3>
                      </button>
                    </div> */}
                    <div className="flex justify-center">
  <button
    onClick={() => setShowUnifiedReview(true)}
    className="px-8 py-4 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors font-medium text-lg"
  >
    Start Review
  </button>
</div>

<div className="text-center">
  <button
    onClick={handleSkip}
    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
  >
    Skip for now
  </button>
</div>

                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-yellow-600 dark:text-yellow-400">
                      <XIcon size={48} className="mx-auto mb-4" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      Review Not Available
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      This order cannot be reviewed at this time.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reviews are only available for completed orders.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <CheckCircleIcon size={48} className="text-emerald-500 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {reviewStatus?.has_review ? 'Review Already Submitted!' : 'Thanks for your review!'}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Your feedback helps us improve our service.
                </p>
                 <button 
              onClick={() => navigate('/orders')}
              className="mt-2 text-sm underline hover:no-underline dark:text-gray-100"
            >
              Back to Order History
            </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* {showProviderReview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl">
                <ProviderReview
                  providerName={orderData.provider}
                  onClose={() => setShowProviderReview(false)}
                  onComplete={handleReviewComplete}
                  orderData={orderData}
                />
              </div>
            </div>
          )}

          {showItemReview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl">
                <ItemReview
                  // itemName={orderData.items[0]} // Using first item, you might want to handle multiple items
                  onClose={() => setShowItemReview(false)}
                  onComplete={handleReviewComplete}
                  orderData={orderData}
                />
              </div>
            </div>
          )} */}

              {showUnifiedReview && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] rounded-xl shadow-xl">
      <UnifiedReviewForm
        providerName={orderData.provider}
        onClose={() => setShowUnifiedReview(false)}
        onComplete={handleReviewComplete}
        orderData={orderData}
      />
    </div>
  </div>
)}


        </div>
      </div>
    </div>
  )
}

export default ReviewPage