// import React, { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { ArrowLeft, Clock, MapPin, Truck, Store } from 'lucide-react';
// import foodListingsAPI from '../../services/foodListingsAPI';
// import CustomerNavBar from '../../components/auth/CustomerNavBar';
// import { useAuth } from '../../context/AuthContext';
// import donationsAPI from '../../services/DonationsAPI';

// const DonationRequestPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [listing, setListing] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [quantity, setQuantity] = useState(1);
//   const [pickupMethod, setPickupMethod] = useState('pickup');
//   const [specialInstructions, setSpecialInstructions] = useState('');
//   const [motivationMessage, setMotivationMessage] = useState('');
//   const [submitting, setSubmitting] = useState(false);

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Truck, Store, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await foodListingsAPI.getFoodListingDetails(id);
 
        
        if (response.success && response.data && response.data.listing) {
          // Use the listing data directly from the response
          const listingData = response.data.listing;

          
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

  const toggleExpand = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CustomerNavBar />
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <CustomerNavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-3">😕</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Donation</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              {error}
            </p>
            <button
              onClick={() => navigate('/food-listing')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <CustomerNavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-3">😕</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Donation Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              The donation listing you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/food-listing')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CustomerNavBar />
      
      <main className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to listings
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 p-5">
            {/* Image Section */}
            <div className="relative overflow-hidden rounded-lg aspect-square bg-gray-100 dark:bg-gray-700">
              {listing.imageUrl || (listing.images && listing.images[0]) ? (
                <img
                  src={listing.imageUrl || listing.images[0]}
                  alt={listing.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Store size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No image available</p>
                  </div>
                </div>
              )}
              <div className="absolute top-3 right-3">
                <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {listing.food_type || 'Donation'}
                </span>
              </div>
            </div>

            {/* Donation Details */}
            <div className="flex flex-col">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {listing.name}
                </h1>
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{listing.provider?.business_name || 'Save-n-Bite Partner'}</span>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6 rounded-r">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        This is a donation request. The provider will review your request and get back to you soon.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available Quantity</h3>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {listing.quantity} {listing.unit}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pickup Window</h3>
                    <div className="flex items-center text-gray-900 dark:text-white">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{listing.pickup_window || 'Flexible'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Request Quantity
                    </label>
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden w-32">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        disabled={quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                        disabled={quantity >= (listing.quantity || 10)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Motivation (Optional)
                    </label>
                    <textarea
                      id="motivation"
                      rows={3}
                      className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Tell us why you're requesting this donation..."
                      value={motivationMessage}
                      onChange={(e) => setMotivationMessage(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      id="instructions"
                      rows={2}
                      className="w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Any special instructions for pickup..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                      submitting
                        ? "bg-emerald-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all`}
                  >
                    {submitting ? "Submitting..." : "Submit Donation Request"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Tabs */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {['Details', 'Provider Info'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => toggleExpand(tab.toLowerCase())}
                  className={`py-3 px-5 text-center border-b-2 font-medium text-sm ${
                    expandedSection === tab.toLowerCase()
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div> */}

          {/* Tab Content */}
          {/* <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={expandedSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {expandedSection === 'details' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">About this donation</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                      {listing.description || 'No description provided.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Category</p>
                        <p className="text-gray-900 dark:text-white">{listing.food_type || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Expires</p>
                        <p className="text-gray-900 dark:text-white">{listing.expiry_date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Storage</p>
                        <p className="text-gray-900 dark:text-white">
                          {listing.storage_instructions || 'Standard storage conditions'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {expandedSection === 'provider info' && listing.provider && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      About {listing.provider.business_name}
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Business Type</p>
                        <p className="text-gray-900 dark:text-white">
                          {listing.provider.business_type || 'Food Provider'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Contact</p>
                        <p className="text-gray-900 dark:text-white">
                          {listing.provider.contact_email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Address</p>
                        <p className="text-gray-900 dark:text-white">
                          {listing.provider.address || 'Address not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div> */}
        </div>
      </main>
    </div>
  );
};

export default DonationRequestPage;


//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center transition-colors duration-300">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
//           <p className="text-gray-600 dark:text-gray-300">Loading donation details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
//         <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
//           <div className="text-red-600 dark:text-red-400 mb-4">
//             <p className="font-medium">Error</p>
//             <p>{error}</p>
//           </div>

//           <button
//             onClick={() => navigate('/food-listing')}
//             className="flex items-center text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mt-4"
//           >
//             <ArrowLeft size={16} className="mr-1" />
//             Back to Listings
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!listing) {
//     return (
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
//         <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
//           <div className="text-orange-600 dark:text-orange-400 mb-4">
//             <p className="font-medium">No Data Available</p>
//             <p>The listing data could not be loaded or is incomplete.</p>
//           </div>
//           <button
//             onClick={() => navigate('/food-listing')}
//             className="flex items-center text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mt-4"
//           >
//             <ArrowLeft size={16} className="mr-1" />
//             Back to Listings
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
//       <CustomerNavBar/>
//       <div className="max-w-3xl mx-auto">
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mb-4"
//         >
//           <ArrowLeft size={16} className="mr-1" />
//           Back to Listings
//         </button>
//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
//           <div className="relative h-64">
//             {(listing.imageUrl || (listing.images && listing.images[0])) ? (
//               <img
//                 src={listing.imageUrl || listing.images[0]}
//                 alt={listing.name}
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <div className="w-full h-full bg-gray-200 flex items-center justify-center">
//                 <div className="text-center text-gray-500">
//                   <Store size={48} className="mx-auto mb-2 opacity-50" />
//                   <p className="text-sm">No image available</p>
//                 </div>
//               </div>
//             )}
//             <div className="absolute top-0 right-0 m-3">
// <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
//   {listing.food_type || 'Food Item'}
// </span>

  
//             </div>
//           </div>
//           <div className="p-6">
// <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
//   {listing.name}
// </h1>

        
//             <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
//               <MapPin size={16} className="mr-1" />
//               <span>{listing.provider?.business_name || 'Unknown Provider'}</span>
//             </div>
//             <div className="flex items-center text-gray-600 dark:text-gray-300 mb-4">
//               <Clock size={16} className="mr-1" />
//               <span>Available until: {listing.expiry_date}</span>
//             </div>

            
//             {listing.pickup_window && (
//               <div className="flex items-center text-gray-600 mb-4">
//                 <Clock size={16} className="mr-1" />
//                 <span>Pickup window: {listing.pickup_window}</span>
//               </div>
//             )}
            
//             {listing.description && (

//               <div className="mb-6">
//                 <p className="text-gray-700 dark:text-gray-300">{listing.description}</p>
//               </div>
//             )}
// {/* Show pricing info if available */}
// {(listing.original_price > 0 || listing.discounted_price > 0) && (
//   <div className="flex items-center gap-4 mb-4">
//     {listing.original_price > 0 && (
//       <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
//         R{listing.original_price}
//       </span>
//     )}
//     {listing.discounted_price > 0 && (
//       <span className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
//         R{listing.discounted_price}
//       </span>
//     )}
//     {listing.discount_percentage > 0 && (
//       <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm px-2 py-1 rounded">
//         {listing.discount_percentage}% off
//       </span>
//     )}
//   </div>
// )}

// {/* Show available quantity */}
// {listing.quantity_available > 0 && (
//   <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
//     Available quantity: {listing.quantity_available}
//   </div>
// )}
            
//             {/* Show dietary info if available */}
//             {listing.dietary_info && listing.dietary_info.length > 0 && (
//               <div className="mb-4">
//                 <p className="text-sm font-medium text-gray-700 mb-2">Dietary Information:</p>
//                 <div className="flex flex-wrap gap-2">
//                   {listing.dietary_info.map((info, index) => (
//                     <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
//                       {info}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}
            
//             {/* Show allergens if available */}
//             {listing.allergens && listing.allergens.length > 0 && (
//               <div className="mb-4">
//                 <p className="text-sm font-medium text-gray-700 mb-2">Allergens:</p>
//                 <div className="flex flex-wrap gap-2">
//                   {listing.allergens.map((allergen, index) => (
//                     <span key={index} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
//                       {allergen}
//                     </span>
//                   ))}
//                 </div>

//               </div>
//             )}
//             <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
//               <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Request Donation</h2>
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Quantity
//                   </label>
//                   <div className="flex items-center">
//                     <button
//                       type="button"
//                       onClick={() => setQuantity(Math.max(1, quantity - 1))}
//                       className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-l-md border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
//                     >
//                       -
//                     </button>
//                     <input
//                       type="number"
//                       min="1"
//                       max={listing.quantity_available || 999}
//                       value={quantity}
//                       onChange={(e) =>
//                         setQuantity(Math.max(1, parseInt(e.target.value) || 1))
//                       }
//                       className="w-16 text-center border-t border-b border-gray-300 dark:border-gray-700 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                     />
//                     <button
//                       type="button"
// onClick={() => setQuantity(Math.min(listing.quantity_available || 999, quantity + 1))}
// className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-r-md border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"

//                     >
//                       +
//                     </button>
//                   </div>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
//                     Collection Method
//                   </label>
//                   <div className="grid grid-cols-2 gap-4">
//                     <button
//                       type="button"
//                       onClick={() => setPickupMethod('pickup')}
//                       className={`flex items-center justify-center p-4 border rounded-md transition-colors ${
//                         pickupMethod === 'pickup' 
//                           ? 'bg-emerald-50 dark:bg-emerald-900 border-emerald-500 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200' 
//                           : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
//                       }`}
//                     >
//                       <Store size={20} className="mr-2" />
//                       Pickup
//                     </button>
//                   </div>
//                 </div>
                
// <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//   Special Instructions (Optional)
// </label>
// <textarea
//   value={specialInstructions}
//   onChange={(e) => setSpecialInstructions(e.target.value)}
//   placeholder="e.g., Please provide packaging, call when arriving"
//   className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//   rows={2}
// />

// <div>
//   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//     Motivation Message (Optional)
//   </label>
//   <textarea
//     value={motivationMessage}
//     onChange={(e) => setMotivationMessage(e.target.value)}
//     placeholder="e.g., We serve 200 kids on Thursdays, helping homeless families"
//     className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
//                     rows={3}
//                   />
//                 </div>
//                 <div className="flex justify-end">
//                   <button
//                     type="submit"
//                     disabled={submitting}
//                     className={`px-6 py-2 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors ${
//                       submitting ? 'opacity-70 cursor-not-allowed' : ''
//                     }`}
//                   >
//                     {submitting ? 'Submitting...' : 'Submit Request'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DonationRequestPage;