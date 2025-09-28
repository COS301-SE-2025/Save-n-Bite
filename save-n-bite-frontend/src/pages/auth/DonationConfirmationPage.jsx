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
  Clock,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
      <CustomerNavBar/>
      <div className="max-w-2xl mx-auto">
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
  <div className="bg-emerald-50 dark:bg-emerald-900 p-6 flex items-center">
    <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400 mr-4" />

            <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">Donation Request Submitted</span>
</h1>
<p className="text-gray-600 dark:text-gray-300">
  Your donation request has been sent to {listing.provider?.business_name || 'the provider'}
</p>

            
            </div>
          </div>
        
          
          <div className="p-6">
            <div className="mb-6">
<h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Donation Details</h2>
<div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-700">
  <div className="flex gap-4">
    {/* Image */}
    <div className="flex-shrink-0">
      {(listing.imageUrl || (listing.images && listing.images[0])) ? (
        <img
          src={listing.imageUrl || listing.images[0]}
          alt={listing.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
      ) : (
        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center dark:bg-gray-600">
          <Store size={24} className="text-gray-400" />
        </div>
      )}
    </div>
    
    {/* Item Details */}
    <div className="flex-1">
      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-1">
        {listing.name}
      </h3>
      
      {listing.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
          {listing.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium">
          Quantity: {donationRequest.quantity}
        </span>
        
        {listing.food_type && (
          <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 px-2 py-1 rounded text-xs">
            {listing.food_type.replace('_', ' ')}
          </span>
        )}
      </div>
                  </div>
                </div>
              </div>
            </div>
{/* Provider & Pickup Info */}
<div className="mb-6">
  <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Pickup Information</h2>
  <div className="bg-gray-50 rounded-lg p-4 space-y-3 dark:bg-gray-700">
    <div className="flex items-center">
      <Store size={18} className="text-gray-600 dark:text-gray-300 mr-3" />
      <div>
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {listing.provider?.business_name || 'Provider'}
        </span>
        {listing.provider?.business_address && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {listing.provider.business_address}
          </p>
        )}
      </div>
                </div>
                
                {listing.pickup_window && (
                  <div className="flex items-center">
                    <Clock size={18} className="text-gray-600 mr-3" />
                    <span className="text-gray-700">
                      Pickup hours: {listing.pickup_window}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center">
<Calendar size={18} className="text-gray-600 dark:text-gray-300 mr-3" />
<span className="text-gray-700 dark:text-gray-200">
  Available until: {listing.expiry_date}
</span>

                </div>
              </div>
            </div>

            {/* Message if provided */}
            {donationRequest.message && (

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Your Message</h2>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-200 italic">
                    "{donationRequest.message}"
                  </p>
                </div>
              </div>
)}

{/* Additional Item Info */}
{(listing.dietary_info?.length > 0 || listing.allergens?.length > 0) && (
  <div className="mb-6">
    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Item Information</h2>
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
      {listing.dietary_info?.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Dietary Info:</p>
          <div className="flex flex-wrap gap-2">
            {listing.dietary_info.map((info, index) => (
              <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded">
                {info}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {listing.allergens?.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Allergens:</p>
          <div className="flex flex-wrap gap-2">
            {listing.allergens.map((allergen, index) => (
              <span key={index} className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded">
                {allergen}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}

{/* Pricing info if available */}
{(listing.original_price > 0 || listing.discounted_price > 0) && (
  <div className="mb-6">
    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Savings</h2>
    <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          {listing.original_price > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Original price: <span className="line-through">R{listing.original_price}</span>
            </p>
          )}
          {listing.discounted_price > 0 && (
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              Your price: R{listing.discounted_price}
            </p>
          )}
        </div>
        {listing.discount_percentage > 0 && (
          <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-3 py-1 rounded-full text-sm font-medium">
            {listing.discount_percentage}% saved!
          </div>
        )}
      </div>
    </div>
  </div>
)}

<div className="border-t border-gray-100 dark:border-gray-700 pt-6 text-center">
  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">

                The provider will review your request and contact you if needed.
                You can view the status of your donation request in your order history.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => navigate('/food-listing')}
className="flex items-center justify-center text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 px-4 py-2 rounded-md hover:bg-emerald-50 transition-colors"

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