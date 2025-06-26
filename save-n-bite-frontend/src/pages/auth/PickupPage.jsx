import React, { useState, useEffect } from 'react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  QrCodeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StarRating from "../../components/CustomerFeedback/StarRating";

// Simple feedback modal for pickup page only
const SimplePickupFeedback = ({ orderNumber, providerName, onClose }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = () => {
    if (rating === 0) return
    // Save the rating and comment
    console.log('Saving pickup feedback:', { orderNumber, rating, comment })
    setIsComplete(true)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const handleSkip = () => {
    setIsComplete(true)
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <XIcon size={24} />
          </button>

          <AnimatePresence mode="wait">
            {!isComplete ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="text-2xl mb-1">🎉</div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Order #{orderNumber} Successfully Collected!
                  </h2>
                  <p className="text-gray-600">
                    Thank you for shopping at {providerName}.
                  </p>
                  <p className="text-sm text-gray-500">
                    We hope you enjoy your meal. Let us know how it went!
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="font-medium text-gray-700 text-center">
                    How was your experience?
                  </p>
                  <div className="flex justify-center">
                    <StarRating rating={rating} setRating={setRating} />
                  </div>
                  <textarea
                    placeholder="Leave a quick note (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <CheckCircleIcon size={48} className="text-emerald-500 mx-auto" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Thanks for your feedback!
                </h2>
                <p className="text-gray-600">
                  You can leave a detailed review anytime from your order history.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const PickupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    itemName,
    itemDescription,
    providerName,
    providerAddress,
    pickupTime,
    orderNumber,
    confirmationCode
  } = location.state || {};
  const [showFeedback, setShowFeedback] = useState(false);

  if (!itemName || !providerName || !pickupTime || !orderNumber || !confirmationCode) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600">No pickup information found. Please return to your cart.</p>
            <button
              onClick={() => navigate('/cart')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full py-8">
      <CustomerNavBar />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">
          Pickup Instructions
        </h1>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
               <p className="text-sm text-emerald-700 mb-1">Order Number</p>
                  <p className="text-xl font-bold text-emerald-800 tracking-wider">
                    #{orderNumber}
                  </p>
                <p className="text-gray-600">{itemDescription}</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                Ready for pickup
              </span>
            </div>
            
    
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start">
                <MapPinIcon
                  size={20}
                  className="mr-2 text-emerald-600 mt-1"
                />
                <div>
                  <p className="font-medium text-gray-800">
                    {providerName}
                  </p>
                  <p className="text-sm text-gray-600">{providerAddress}</p>
                </div>
              </div>
              <div className="flex items-start">
                <ClockIcon size={20} className="mr-2 text-emerald-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-800">Selected pickup time slot</p>
                  <p className="text-sm text-gray-600">{pickupTime}</p>
                </div>
              </div>
              <div className="flex items-start">
                <QrCodeIcon
                  size={20}
                  className="mr-2 text-emerald-600 mt-1"
                />
                <div>
                  <p className="font-medium text-gray-800">
                    Show this confirmation code at pickup
                  </p>
                  <p className="text-sm text-gray-600">
                    {confirmationCode}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50 flex flex-col items-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${orderNumber}`}
              alt="QR Code"
              className="w-32 h-32 mb-4"
            />
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Confirmation Code</p>
              <p className="text-2xl font-bold text-emerald-600 tracking-wider">
                {confirmationCode}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Show this code to the provider when picking up your order
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Reminder</h3>
          <p className="text-blue-600 text-sm">
            You'll get a reminder notification 30 minutes before your pickup
            window starts.
          </p>
        </div>
      </div>
      {showFeedback && (
        <SimplePickupFeedback
          orderNumber={orderNumber}
          providerName={providerName}
          onClose={() => {
            setShowFeedback(false);
          }}
        />
      )}
    </div>
  );
}

export default PickupPage