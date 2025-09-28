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
  ShoppingBagIcon,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import StarRating from "../../components/CustomerFeedback/StarRating";

// Simple feedback modal for pickup page only
const SimplePickupFeedback = ({ orderNumbers, isMultiple, onClose }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const handleSubmit = () => {
    if (rating === 0) return
    // Save the rating and comment for all orders
    console.log('Saving pickup feedback:', { orderNumbers, rating, comment, isMultiple })
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

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadOrdersData();
        loadReviewsData();
      }
    };
    const onFocus = () => {
      loadOrdersData();
      loadReviewsData();
    };
  
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
  
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-xl shadow-xl">
        <div className="relative p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    {isMultiple 
                      ? `${orderNumbers.length} Orders Successfully Collected!`
                      : `Order #${orderNumbers[0]} Successfully Collected!`
                    }
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Thank you for shopping.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We hope you enjoy your meal{isMultiple ? 's' : ''}. Let us know how it went!
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="font-medium text-gray-700 dark:text-gray-200 text-center">
                    How was your experience?
                  </p>
                  <div className="flex justify-center">
                    <StarRating rating={rating} setRating={setRating} />
                  </div>
                  <textarea
                    placeholder="Leave a quick note (optional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border rounded-lg resize-none h-24 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleSkip}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
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
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  Thanks for your feedback!
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
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

  // Extract data from location state - handle both single and multiple pickups
  const stateData = location.state || {};
  
  // Check if this is a multi-item pickup
  const isMultipleItems = stateData.isMultipleItems || false;
  const pickups = stateData.pickups || [];
  
  // For backward compatibility with single-item pickups
  const singlePickupData = {
    orderId: stateData.orderId,
    orderNumber: stateData.orderNumber,
    confirmationCode: stateData.confirmationCode,
    pickupId: stateData.pickupId,
    pickupStatus: stateData.pickupStatus,
    itemName: stateData.itemName,
    itemDescription: stateData.itemDescription,
    pickupWindow: stateData.pickupWindow,
    businessName: stateData.businessName,
    locationName: stateData.locationName,
    locationAddress: stateData.locationAddress,
    locationInstructions: stateData.locationInstructions,
    contactPerson: stateData.contactPerson,
    contactPhone: stateData.contactPhone,
    pickupDate: stateData.pickupDate,
    pickupStartTime: stateData.pickupStartTime,
    pickupEndTime: stateData.pickupEndTime,
    formattedPickupTime: stateData.formattedPickupTime,
    qrCodeData: stateData.qrCodeData,
    slotNumber: stateData.slotNumber,
    availableSpots: stateData.availableSpots,
    customerNotes: stateData.customerNotes
  };

  // Summary data for multi-item pickups
  const summaryData = {
    totalItems: stateData.totalItems || 1,
    totalAmount: stateData.totalAmount || 0,
    pickupTimeLabel: stateData.pickupTimeLabel || 'Business Hours',
    pickupDate: stateData.pickupDate,
    checkoutSuccess: stateData.checkoutSuccess || false
  };

  // Determine what data to use
  const displayData = isMultipleItems ? pickups : [singlePickupData];
  
  // Check if we have the minimum required data
  if (displayData.length === 0 || !displayData[0].orderNumber || !displayData[0].confirmationCode) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300">No pickup information found. Please return to your cart.</p>
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

  // Get the first pickup for location/timing info (all should be similar for multi-item)
  const primaryPickup = displayData[0];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-300">
      <CustomerNavBar />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8 text-gray-800 dark:text-gray-100">
          Pickup Instructions
        </h1>
        
        {/* Order Header - Multiple Items or Single */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                {isMultipleItems ? (
                  <>
                    <p className="text-sm text-emerald-700 mb-1">Multiple Orders</p>
                    <p className="text-xl font-bold text-emerald-800 tracking-wider mb-2">
                      {displayData.length} Items Ordered
                    </p>
                    <div className="space-y-1">
                      {displayData.map((pickup, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <ShoppingBagIcon size={16} className="text-gray-500" />
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {pickup.itemName}
                          </span>
                          <span className="text-gray-600 dark:text-gray-300 text-sm">
                            (#{pickup.orderNumber})
                          </span>
                        </div>
                      ))}
                    </div>
                    {summaryData.totalAmount > 0 && (
                      <p className="text-lg font-semibold text-emerald-600 mt-2">
                        Total: R{summaryData.totalAmount.toFixed(2)}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-emerald-700 mb-1">Order Number</p>
                    <p className="text-xl font-bold text-emerald-800 tracking-wider">
                      #{primaryPickup.orderNumber}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-2">
                      {primaryPickup.itemName}
                    </h2>
                    {primaryPickup.itemDescription && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {primaryPickup.itemDescription}
                      </p>
                    )}
                  </>
                )}
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-sm font-medium">
                Ready for pickup
              </span>
            </div>
          </div>
        </div>

        {/* Main Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          
          {/* Pickup Details Card */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <ClockIcon size={20} className="mr-2 text-emerald-600" />
              Pickup Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-200">Pickup Time</p>
                <p className="text-gray-600 dark:text-gray-300">
                  {summaryData.pickupTimeLabel || primaryPickup.formattedPickupTime || 'Business Hours (8:00 AM - 5:00 PM)'}
                </p>
              </div>
              
              {/* Show confirmation codes */}
              {isMultipleItems ? (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200 mb-2">Confirmation Codes</p>
                  <div className="space-y-2">
                    {displayData.map((pickup, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {pickup.itemName}
                        </span>
                        <span className="font-bold text-emerald-600 text-sm">
                          {pickup.confirmationCode}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Confirmation Code</p>
                  <p className="text-2xl font-bold text-emerald-600 tracking-wider">
                    {primaryPickup.confirmationCode}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location Details Card */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
              <MapPinIcon size={20} className="mr-2 text-emerald-600" />
              Pickup Location
            </h3>
            
            <div className="space-y-4">
              {primaryPickup.businessName && (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <StoreIcon size={16} className="mr-1" />
                    Business
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">{primaryPickup.businessName}</p>
                </div>
              )}
              
              {primaryPickup.locationName && (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Location Name</p>
                  <p className="text-gray-600 dark:text-gray-300">{primaryPickup.locationName}</p>
                </div>
              )}
              
              {primaryPickup.locationAddress && (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200">Address</p>
                  <p className="text-gray-600 dark:text-gray-300">{primaryPickup.locationAddress}</p>
                </div>
              )}
              
              {primaryPickup.contactPhone && (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <PhoneIcon size={16} className="mr-1" />
                    Contact
                  </p>
                  <div className="text-gray-600 dark:text-gray-300">
                    {primaryPickup.contactPerson && <p>{primaryPickup.contactPerson}</p>}
                    <a href={`tel:${primaryPickup.contactPhone}`} className="text-emerald-600 hover:underline">
                      {primaryPickup.contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        {primaryPickup.locationInstructions && (
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
              <InfoIcon size={16} className="mr-1" />
              Pickup Instructions
            </h3>
            <p className="text-blue-700 dark:text-blue-100 text-sm">{primaryPickup.locationInstructions}</p>
          </div>
        )}

        {/* QR Code Section - Multiple codes if multiple items */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center justify-center">
            <QrCodeIcon size={20} className="mr-2 text-emerald-600" />
            Show at Pickup
          </h3>
          
          {isMultipleItems ? (
            <div className="space-y-6">
              <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-4">
                Show these QR codes or confirmation codes to collect your orders
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayData.map((pickup, index) => (
                  <div key={index} className="text-center border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-2 text-sm">
                      {pickup.itemName}
                    </h4>
                    
                    {pickup.qrCodeData ? (
                      <img
                        src={pickup.qrCodeData}
                        alt={`Pickup QR Code for ${pickup.itemName}`}
                        className="w-24 h-24 mx-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-2"
                      />
                    ) : (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${pickup.confirmationCode}`}
                        alt={`Confirmation Code QR for ${pickup.itemName}`}
                        className="w-24 h-24 mx-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-2"
                      />
                    )}
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Code</p>
                    <p className="text-lg font-bold text-emerald-600 tracking-wider">
                      {pickup.confirmationCode}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {primaryPickup.qrCodeData ? (
                <img
                  src={primaryPickup.qrCodeData}
                  alt="Pickup QR Code"
                  className="w-40 h-40 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${primaryPickup.confirmationCode}`}
                  alt="Confirmation Code QR"
                  className="w-40 h-40 border border-gray-200 dark:border-gray-700 rounded-lg"
                />
              )}
              
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Confirmation Code</p>
                <p className="text-2xl font-bold text-emerald-600 tracking-wider">
                  {primaryPickup.confirmationCode}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                  Show this QR code or confirmation code to the provider when collecting your order
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reminder */}
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Important Reminders</h3>
          <ul className="text-amber-700 dark:text-amber-100 text-sm space-y-1">
            <li>• Arrive during business hours for pickup</li>
            <li>• Have your confirmation code{isMultipleItems ? 's' : ''} ready</li>
            <li>• Contact the provider if you need assistance</li>
            {isMultipleItems && <li>• You may need to show multiple codes for different items</li>}
            {primaryPickup.customerNotes && <li>• Note: {primaryPickup.customerNotes}</li>}
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
            className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Order More Food
          </button>
        </div>
      </div>

      {showFeedback && (
        <SimplePickupFeedback
          orderNumbers={displayData.map(p => p.orderNumber)}
          isMultiple={isMultipleItems}
          onClose={() => {
            setShowFeedback(false);
          }}
        />
      )}
    </div>
  );
}

export default PickupPage