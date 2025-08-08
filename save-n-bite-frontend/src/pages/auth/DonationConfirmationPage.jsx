import React from 'react'
import CustomerNavBar from '../../components/auth/CustomerNavBar';
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
  if (!listing) {
    navigate('/listings')
    return null
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
      <CustomerNavBar/>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
          <div className="bg-emerald-50 dark:bg-emerald-900 p-6 flex items-center">
            <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400 mr-4" />
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Donation Request Submitted
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Your donation request has been sent to {listing.provider?.business_name}
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Donation Details</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-start mb-3">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-16 h-16 object-cover rounded-md mr-3"
                  />
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">{listing.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Quantity: {donationRequest.quantity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Pickup Information (uncomment if needed) */}
            {/* <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Pickup Information</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  {donationRequest.pickupMethod === 'pickup' ? (
                    <Store size={18} className="text-gray-600 dark:text-gray-300 mr-2" />
                  ) : (
                    <Truck size={18} className="text-gray-600 dark:text-gray-300 mr-2" />
                  )}
                  <span className="text-gray-700 dark:text-gray-200">
                    {donationRequest.pickupMethod === 'pickup'
                      ? 'Pickup'
                      : 'Delivery'}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin size={18} className="text-gray-600 dark:text-gray-300 mr-2" />
                  <span className="text-gray-700 dark:text-gray-200">
                    {listing.provider}, {listing.address || '123 Main St'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar size={18} className="text-gray-600 dark:text-gray-300 mr-2" />
                  <span className="text-gray-700 dark:text-gray-200">
                    Available for pickup until {listing.expirationTime}
                  </span>
                </div>
              </div>
            </div> */}
            {/* Message (uncomment if needed) */}
            {/* {donationRequest.message && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Your Message</h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-200 italic">
                    "{donationRequest.message}"
                  </p>
                </div>
              </div>
            )} */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                The provider will review your request and contact you if needed.
                You can view the status of your donation request in your order
                history.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate('/food-listing')}
                  className="flex items-center text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Browse More Listings
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  View Order History
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