import React, { useState } from 'react'
import {
  QrCodeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
} from 'lucide-react'

import PostPickupFeedback from "../../components/CustomerFeedback/PostPickupFeedback";


// Mock pickup data
const pickups = [
  {
    id: 1,
    orderNumber: 'SNB1234',
    items: ['Assorted Pastries Box'],
    provider: 'Sweet Bakery',
    address: '123 Main St, Eco City',
    pickupTime: 'Today, 5 PM - 8 PM',
    qrCode:
      'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SNB1234',
    status: 'Ready for pickup',
  },
]
const PickupPage = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [pickedUp, setPickedUp] = useState(false);
  const handleMarkAsPickedUp = () => {
    setPickedUp(true); 
    setTimeout(() => {
      setShowFeedback(true); 
    }, 300); 
  };


  return (
    <div className="min-h-screen bg-gray-50 w-full py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">
          Pickup Instructions
        </h1>
        {pickups.map((pickup) => (
          <div
            key={pickup.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Order #{pickup.orderNumber}
                  </h2>
                  <p className="text-gray-600">{pickup.items.join(', ')}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                  {pickup.status}
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
                      {pickup.provider}
                    </p>
                    <p className="text-sm text-gray-600">{pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <ClockIcon size={20} className="mr-2 text-emerald-600 mt-1" />
                  <div>
                    <p className="font-medium text-gray-800">Pickup Window</p>
                    <p className="text-sm text-gray-600">{pickup.pickupTime}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <QrCodeIcon
                    size={20}
                    className="mr-2 text-emerald-600 mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-800">
                      Show this at pickup
                    </p>
                    <p className="text-sm text-gray-600">
                      Order confirmation code
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex flex-col items-center">
              <img
                src={pickups[0].qrCode}
                alt="QR Code"
                className="w-32 h-32 mb-4"
              />
              <button
                onClick={handleMarkAsPickedUp}
                className={`px-4 py-2 rounded-md transition-colors ${
                  pickedUp
                    ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                disabled={pickedUp}
              >
                {pickedUp ? 'Marked as Picked Up' : 'Mark as Picked Up'}
              </button>
            </div>
          </div>
        ))}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Reminder</h3>
          <p className="text-blue-600 text-sm">
            You'll get a reminder notification 30 minutes before your pickup
            window starts.
          </p>
        </div>
      </div>
      {showFeedback && (
        <PostPickupFeedback
          orderNumber={pickups[0].orderNumber}
          providerName={pickups[0].provider}
          itemName={pickups[0].items[0]}
          onClose={() => {
            setShowFeedback(false);
          }}
        />
      )}
    </div>
  )
}
export default PickupPage
