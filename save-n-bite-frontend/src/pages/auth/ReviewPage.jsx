import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XIcon, ArrowLeftIcon } from 'lucide-react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import StarRating from '../../components/CustomerFeedback/StarRating'
import ProviderReview from '../../components/CustomerFeedback/ProviderReview'
import ItemReview from '../../components/CustomerFeedback/ItemReview'
import reviewsAPI from '../../services/reviewsAPI'

const ReviewPage = () => {
  const { orderId } = useParams() // This is actually the interaction ID from our order history
  const navigate = useNavigate()
  const [interaction, setInteraction] = useState(null)
  const [reviewStatus, setReviewStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1)
  const [showProviderReview, setShowProviderReview] = useState(false)
  const [showItemReview, setShowItemReview] = useState(false)
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
    setIsComplete(true)
    setTimeout(() => {
      navigate('/orders')
    }, 2000)
  }

  const handleReviewComplete = () => {
    setShowProviderReview(false)
    setShowItemReview(false)
    setIsComplete(true)
    setTimeout(() => {
      navigate('/orders')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading interaction details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error ) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error || 'Interaction not found'}</p>
            <button 
              onClick={() => navigate('/orders')}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Back to Order History
            </button>
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
    <div className="bg-gray-50 min-h-screen w-full">
      <CustomerNavBar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeftIcon size={20} className="mr-2" />
            Back to Order History
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Review Your Order
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Interaction Details */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Order Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              {/* <p><strong>Business:</strong> {interaction.business?.name}</p>
              <p><strong>Type:</strong> {interaction.type}</p>
              <p><strong>Items:</strong> {interaction.items_count || 1} item(s)</p>
              <p><strong>Amount:</strong> {interaction.order?.total_amount ? `R${interaction.order.total_amount}` : 'Free'}</p>
              <p><strong>Date:</strong> {new Date(interaction.created_at).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {interaction.status}</p> */}
            </div>
          </div>

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
                    <h2 className="text-xl font-semibold text-gray-800">
                      Review Already Submitted
                    </h2>
                    <p className="text-gray-600">
                      Thank you for your feedback on this order!
                    </p>
                  </div>
                ) : reviewStatus?.can_review ? (
                  <>
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Would you like to leave a review?
                      </h2>
                      <p className="text-gray-600">
                        Order from 
                      </p>
                      <p className="text-sm text-gray-500">
                        Your feedback helps us and our providers improve.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setShowProviderReview(true)}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">🏪</div>
                        <h3 className="font-medium mb-1">Review Food Provider</h3>
                      </button>
                      <button
                        onClick={() => setShowItemReview(true)}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">🍽️</div>
                        <h3 className="font-medium mb-1">Review Items</h3>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-yellow-600">
                      <XIcon size={48} className="mx-auto mb-4" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Review Not Available
                    </h2>
                    <p className="text-gray-600">
                      This order cannot be reviewed at this time.
                    </p>
                    <p className="text-sm text-gray-500">
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
                <h2 className="text-xl font-semibold text-gray-800">
                  {reviewStatus?.has_review ? 'Review Already Submitted!' : 'Thanks for your review!'}
                </h2>
                <p className="text-gray-600">
                  Your feedback helps us improve our service.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting you back to order history...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {showProviderReview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
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
              <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
                <ItemReview
                  // itemName={orderData.items[0]} // Using first item, you might want to handle multiple items
                  onClose={() => setShowItemReview(false)}
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