import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Truck, Store } from 'lucide-react';
import foodListingsAPI from '../../services/foodListingsAPI';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import { useAuth } from '../../context/AuthContext';
import donationsAPI from '../../services/DonationsAPI';

const DonationRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [pickupMethod, setPickupMethod] = useState('pickup');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [motivationMessage, setMotivationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await foodListingsAPI.getFoodListingDetails(id);
        console.log("Full API Response:", response);
        console.log("Response Data:", response.data);
        
        if (response.success && response.data && response.data.listing) {
          // Use the listing data directly from the response
          const listingData = response.data.listing;
          console.log("Direct listing data:", listingData);
          
          setListing(listingData);
        } else {
          setError(response.error || 'Failed to load listing - no data received');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('An error occurred while fetching the listing');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    } else {
      setError('No listing ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const donationRequest = {
        listingId: id,
        quantity,
        specialInstructions,
        motivationMessage,
        // verificationDocuments: [] // Add if needed
      };

      console.log('Submitting donation request:', donationRequest);
      const response = await donationsAPI.requestDonation(donationRequest);
      
      if (response.success) {
        navigate(`/donation-confirmation/${id}`, {
          state: {
            listing,
            donationRequest: {
              ...donationRequest,
              interaction_id: response.data.interaction_id,
              requested_quantity: response.data.requested_quantity,
              available_quantity: response.data.available_quantity
            },
          },
        });
      } else {
        setError(response.error || 'Failed to submit donation request');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Donation request error:', err);
      setError('Failed to submit donation request. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading donation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-red-600 mb-4">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
          
          <button
            onClick={() => navigate('/food-listing')}
            className="flex items-center text-emerald-600 hover:text-emerald-800 mt-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-orange-600 mb-4">
            <p className="font-medium">No Data Available</p>
            <p>The listing data could not be loaded or is incomplete.</p>
          </div>
        
          <button
            onClick={() => navigate('/food-listing')}
            className="flex items-center text-emerald-600 hover:text-emerald-800 mt-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <CustomerNavBar/>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-emerald-600 hover:text-emerald-800 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Listings
        </button>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative h-64">
            {(listing.imageUrl || (listing.images && listing.images[0])) ? (
              <img
                src={listing.imageUrl || listing.images[0]}
                alt={listing.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Store size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No image available</p>
                </div>
              </div>
            )}
            <div className="absolute top-0 right-0 m-3">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-200">
                {listing.food_type || 'Food Item'}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {listing.name}
            </h1>
            
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin size={16} className="mr-1" />
              <span>{listing.provider?.business_name || 'Unknown Provider'}</span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-4">
              <Clock size={16} className="mr-1" />
              <span>Available until: {listing.expiry_date}</span>
            </div>
            
            {listing.pickup_window && (
              <div className="flex items-center text-gray-600 mb-4">
                <Clock size={16} className="mr-1" />
                <span>Pickup window: {listing.pickup_window}</span>
              </div>
            )}
            
            {listing.description && (
              <div className="mb-6">
                <p className="text-gray-700">{listing.description}</p>
              </div>
            )}
            
            {/* Show pricing info if available */}
            {(listing.original_price > 0 || listing.discounted_price > 0) && (
              <div className="flex items-center gap-4 mb-4">
                {listing.original_price > 0 && (
                  <span className="text-lg text-gray-500 line-through">
                    R{listing.original_price}
                  </span>
                )}
                {listing.discounted_price > 0 && (
                  <span className="text-xl font-semibold text-emerald-600">
                    R{listing.discounted_price}
                  </span>
                )}
                {listing.discount_percentage > 0 && (
                  <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
                    {listing.discount_percentage}% off
                  </span>
                )}
              </div>
            )}
            
            {/* Show available quantity */}
            {listing.quantity_available > 0 && (
              <div className="text-sm text-gray-600 mb-4">
                Available quantity: {listing.quantity_available}
              </div>
            )}
            
            {/* Show dietary info if available */}
            {listing.dietary_info && listing.dietary_info.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Dietary Information:</p>
                <div className="flex flex-wrap gap-2">
                  {listing.dietary_info.map((info, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {info}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Show allergens if available */}
            {listing.allergens && listing.allergens.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Allergens:</p>
                <div className="flex flex-wrap gap-2">
                  {listing.allergens.map((allergen, index) => (
                    <span key={index} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-xl font-semibold mb-4">Request Donation</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 bg-gray-100 rounded-l-md border border-gray-300 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={listing.quantity_available || 999}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-16 text-center border-t border-b border-gray-300 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(listing.quantity_available || 999, quantity + 1))}
                      className="px-3 py-2 bg-gray-100 rounded-r-md border border-gray-300 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPickupMethod('pickup')}
                      className={`flex items-center justify-center p-4 border rounded-md transition-colors ${
                        pickupMethod === 'pickup' 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Store size={20} className="mr-2" />
                      Pickup
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Instructions (Optional)
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g., Please provide packaging, call when arriving"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivation Message (Optional)
                  </label>
                  <textarea
                    value={motivationMessage}
                    onChange={(e) => setMotivationMessage(e.target.value)}
                    placeholder="e.g., We serve 200 kids on Thursdays, helping homeless families"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors ${
                      submitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationRequestPage;