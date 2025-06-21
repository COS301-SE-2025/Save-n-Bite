import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  ArrowLeft,
  Calendar,
  MapPin,
  Truck,
  Store,
} from 'lucide-react'
const DonationConfirmationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { listing, donationRequest } = location.state || {}
  // If no data was passed, redirect back to listings
  if (!listing) {
    navigate('/listings')
    return null
  }
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
         <button
                    onClick={() => navigate('/food-listing')}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Listings
                  </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-50 p-6 flex items-center">
            <CheckCircle size={32} className="text-blue-600 mr-4" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Donation Request Submitted
              </h1>
              <p className="text-gray-600">
                Your donation request has been sent to {listing.provider}
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Donation Details</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start mb-3">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-16 h-16 object-cover rounded-md mr-3"
                  />
                  <div>
                    <h3 className="font-medium">{listing.title}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {donationRequest.quantity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Pickup Information</h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  {donationRequest.pickupMethod === 'pickup' ? (
                    <Store size={18} className="text-gray-600 mr-2" />
                  ) : (
                    <Truck size={18} className="text-gray-600 mr-2" />
                  )}
                  <span className="text-gray-700">
                    {donationRequest.pickupMethod === 'pickup'
                      ? 'Pickup'
                      : 'Delivery'}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin size={18} className="text-gray-600 mr-2" />
                  <span className="text-gray-700">
                    {listing.provider}, {listing.address || '123 Main St'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar size={18} className="text-gray-600 mr-2" />
                  <span className="text-gray-700">
                    Available for pickup until {listing.expirationTime}
                  </span>
                </div>
              </div>
            </div>
            {donationRequest.message && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Your Message</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 italic">
                    "{donationRequest.message}"
                  </p>
                </div>
              </div>
            )}
            <div className="border-t border-gray-100 pt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                The provider will review your request and contact you if needed.
                You can view the status of your donation in your transaction
                history.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                 <button
                            onClick={() => navigate('/food-listing')}
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <ArrowLeft size={16} className="mr-1" />
                           Browse More Listings
                          </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors"
                >
                  View Transaction History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default DonationConfirmationPage
