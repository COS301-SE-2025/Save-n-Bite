import React, { useState, useEffect } from 'react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  QrCodeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XIcon,
  PhoneIcon,
  InfoIcon,
  StoreIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StarRating from "../../components/CustomerFeedback/StarRating";

// Simple feedback modal for pickup page only
const SimplePickupFeedback = ({ orderNumber, onClose }) => {
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
                    Thank you for shopping.
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
  const [showFeedback, setShowFeedback] = useState(false);

  // Extract all the enhanced data from location state
  const {
    // Order details
    orderId,
    orderNumber,
    confirmationCode,
    pickupId,
    pickupStatus,
    
    // Food item details
    itemName,
    itemDescription,
    pickupWindow,
    
    // Business information
    businessName,
    
    // Location details
    locationName,
    locationAddress,
    locationInstructions,
    contactPerson,
    contactPhone,
    
    // Timing information
    pickupDate,
    pickupStartTime,
    pickupEndTime,
    formattedPickupTime,
    
    // QR Code
    qrCodeData,
    
    // Additional details
    slotNumber,
    availableSpots,
    customerNotes
  } = location.state || {};

  // Check if we have the minimum required data
  if (!orderNumber || !confirmationCode || !itemName || !formattedPickupTime) {
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
        
        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-emerald-700 mb-1">Order Number</p>
                <p className="text-xl font-bold text-emerald-800 tracking-wider">
                  #{orderNumber}
                </p>
                <h2 className="text-lg font-semibold text-gray-800 mt-2">{itemName}</h2>
                {itemDescription && (
                  <p className="text-gray-600 text-sm">{itemDescription}</p>
                )}
              </div>
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                Ready for pickup
              </span>
            </div>
          </div>
        </div>

        {/* Main Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Pickup Details Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ClockIcon size={20} className="mr-2 text-emerald-600" />
              Pickup Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-700">Scheduled Time</p>
                <p className="text-gray-600">{formattedPickupTime}</p>
                {pickupWindow && (
                  <p className="text-sm text-gray-500">Window: {pickupWindow}</p>
                )}
              </div>
              
              {slotNumber && (
                <div>
                  <p className="font-medium text-gray-700">Time Slot</p>
                  <p className="text-gray-600">Slot #{slotNumber}</p>
                </div>
              )}
              
              <div>
                <p className="font-medium text-gray-700">Confirmation Code</p>
                <p className="text-2xl font-bold text-emerald-600 tracking-wider">
                  {confirmationCode}
                </p>
              </div>
            </div>
          </div>

          {/* Location Details Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MapPinIcon size={20} className="mr-2 text-emerald-600" />
              Pickup Location
            </h3>
            
            <div className="space-y-4">
              {businessName && (
                <div>
                  <p className="font-medium text-gray-700 flex items-center">
                    <StoreIcon size={16} className="mr-1" />
                    Business
                  </p>
                  <p className="text-gray-600">{businessName}</p>
                </div>
              )}
              
              {locationName && (
                <div>
                  <p className="font-medium text-gray-700">Location Name</p>
                  <p className="text-gray-600">{locationName}</p>
                </div>
              )}
              
              {locationAddress && (
                <div>
                  <p className="font-medium text-gray-700">Address</p>
                  <p className="text-gray-600">{locationAddress}</p>
                </div>
              )}
              
              {contactPhone && (
                <div>
                  <p className="font-medium text-gray-700 flex items-center">
                    <PhoneIcon size={16} className="mr-1" />
                    Contact
                  </p>
                  <div className="text-gray-600">
                    {contactPerson && <p>{contactPerson}</p>}
                    <a href={`tel:${contactPhone}`} className="text-emerald-600 hover:underline">
                      {contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        {locationInstructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
              <InfoIcon size={16} className="mr-1" />
              Pickup Instructions
            </h3>
            <p className="text-blue-700 text-sm">{locationInstructions}</p>
          </div>
        )}

        {/* QR Code Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
            <QrCodeIcon size={20} className="mr-2 text-emerald-600" />
            Show at Pickup
          </h3>
          
          <div className="flex flex-col items-center space-y-4">
            {qrCodeData ? (
              <img
                src={qrCodeData}
                alt="Pickup QR Code"
                className="w-40 h-40 border border-gray-200 rounded-lg"
              />
            ) : (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${confirmationCode}`}
                alt="Confirmation Code QR"
                className="w-40 h-40 border border-gray-200 rounded-lg"
              />
            )}
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Confirmation Code</p>
              <p className="text-2xl font-bold text-emerald-600 tracking-wider">
                {confirmationCode}
              </p>
              <p className="text-xs text-gray-500 mt-2 max-w-xs">
                Show this QR code or confirmation code to the provider when collecting your order
              </p>
            </div>
          </div>
        </div>

        {/* Reminder */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-medium text-amber-800 mb-2">Important Reminders</h3>
          <ul className="text-amber-700 text-sm space-y-1">
            <li>• Arrive within your scheduled pickup window</li>
            <li>• Have your confirmation code ready</li>
            <li>• Contact the provider if you're running late</li>
            {customerNotes && <li>• Note: {customerNotes}</li>}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          {/* <button
            onClick={() => setShowFeedback(true)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Mark as Collected
          </button> */}
          
          <button
            onClick={() => navigate('/food-listing')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Order More Food
          </button>
        </div>
      </div>

      {showFeedback && (
        <SimplePickupFeedback
          orderNumber={orderNumber}
          onClose={() => {
            setShowFeedback(false);
          }}
        />
      )}
    </div>
  );
}

export default PickupPage