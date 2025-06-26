import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, XIcon, ArrowLeftIcon } from 'lucide-react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import StarRating from '../../components/CustomerFeedback/StarRating'
import ProviderReview from '../../components/CustomerFeedback/ProviderReview'
import ItemReview from '../../components/CustomerFeedback/ItemReview'

// Mock function to get order details (replace with actual API call)
const getOrderById = (orderId) => {
  // Load orders from localStorage
  const customerOrders = JSON.parse(localStorage.getItem('customerOrderHistory') || '[]');
  
  // Find the order by ID
  const order = customerOrders.find(order => order.id === parseInt(orderId));
  
  if (order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      items: order.items.map(item => item.title),
      provider: order.provider,
      status: order.status,
      date: order.date,
      total: order.total,
      pickupTime: order.pickupTime,
      pickupAddress: order.pickupAddress
    };
  }
  
  return null;
}

const ReviewPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [step, setStep] = useState(1)
  const [showProviderReview, setShowProviderReview] = useState(false)
  const [showItemReview, setShowItemReview] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Load order data using the order ID from URL params
    const orderData = getOrderById(orderId);
    if (orderData) {
      setOrder(orderData);
    } else {
      // Redirect to order history if order not found
      navigate('/orders');
    }
  }, [orderId, navigate]);

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

  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
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
          <AnimatePresence mode="wait">
            {step === 1 && !isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Would you like to leave a review?
                  </h2>
                  <p className="text-gray-600">
                    Order #{order.orderNumber} from {order.provider}
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
                    {/* <p className="text-sm text-gray-500">Rate {order.provider}</p> */}
                  </button>
                  <button
                    onClick={() => setShowItemReview(true)}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-center"
                  >
                    <div className="text-2xl mb-2">🍽️</div>
                    <h3 className="font-medium mb-1">Review Items</h3>
                    {/* <p className="text-sm text-gray-500">Rate the food quality</p> */}
                  </button>
                </div>

                {/* <div className="flex justify-center pt-4">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Maybe later
                  </button>
                </div> */}
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
                  Thanks for your review!
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
                  providerName={order.provider}
                  onClose={() => setShowProviderReview(false)}
                  onComplete={handleReviewComplete}
                  orderData={order}
                />
              </div>
            </div>
          )}

          {showItemReview && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
                <ItemReview
                  itemName={order.items[0]} // Using first item, you might want to handle multiple items
                  onClose={() => setShowItemReview(false)}
                  onComplete={handleReviewComplete}
                  orderData={order}
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