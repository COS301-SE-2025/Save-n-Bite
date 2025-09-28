// import React, { useState, useEffect } from 'react';
// import { useParams, Link, useNavigate } from 'react-router-dom';
// import FoodItemHeader from '../../components/auth/FoodItemHeader';
// import FoodItemDetails from '../../components/auth/FoodItemDetails';
// import PriceDisplay from '../../components/auth/PriceDisplay';
// import RelatedItems from '../../components/auth/RelatedItems';
// import StoreLocation from '../../components/auth/StoreLocation';
// import CustomerNavBar from '../../components/auth/CustomerNavBar';
// import { ShoppingCartIcon, Heart } from 'lucide-react';
// import foodAPI from '../../services/FoodAPI';
// import BusinessAPI from '../../services/BusinessAPI';

// const FoodItem = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [buttonStatus, setButtonStatus] = useState("idle");
//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [quantity, setQuantity] = useState(1);
  
//   // Follow functionality state
//   const [isFollowing, setIsFollowing] = useState(false);
//   const [followLoading, setFollowLoading] = useState(false);
//   const [businessProfile, setBusinessProfile] = useState(null);

//   useEffect(() => {
//     fetchItemDetails();
//   }, [id]);

//   useEffect(() => {
//     if (item?.provider?.id) {
//       fetchBusinessProfile();
//     }
//   }, [item]);

//   const fetchItemDetails = async () => {
//     try {
//       const response = await foodAPI.getFoodListingDetails(id);
//       if (response.success) {
//         setItem(response.data);
//       } else {
//         setError(response.error);
//       }
//     } catch (err) {
//       setError('Failed to load food item details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBusinessProfile = async () => {
//     try {
//       // The API expects the provider's user ID, which might be different from provider.id
//       // Check if we have provider.user_id or provider.provider_id first
//       const providerId = item.provider.user_id || item.provider.provider_id || item.provider.id;
//       console.log('Fetching business profile for ID:', providerId); // Debug log
      
//       const response = await BusinessAPI.getBusinessProfile(providerId);
//       if (response.success) {
//         setBusinessProfile(response.data);
//         setIsFollowing(response.data.is_following);
//       } else {
//         console.error('Business profile fetch failed:', response.error);
//       }
//     } catch (err) {
//       console.error('Failed to fetch business profile:', err);
//     }
//   };
  
//   const handleAddToCart = async (e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     if (buttonStatus === "added") {
//       navigate('/cart');
//       return;
//     }

//     setButtonStatus("loading");

//     try {
//       const response = await foodAPI.addToCart(id, quantity);
//       if (response.success) {
//         setButtonStatus("added");
//         setTimeout(() => {
//           navigate('/cart');
//         }, 1500);
//       } else {
//         setError(response.error);
//         setButtonStatus("idle");
//       }
//     } catch (err) {
//       setError('Failed to add item to cart');
//       setButtonStatus("idle");
//     }
//   };

//   const handleFollowToggle = async (e) => {
//     e.preventDefault();
//     e.stopPropagation();

//     // Get the correct provider ID
//     const providerId = item.provider.user_id || item.provider.provider_id || item.provider.id;
//     console.log('Following/unfollowing business ID:', providerId); // Debug log
    
//     if (!providerId) {
//       setError('Business information not available');
//       return;
//     }

//     setFollowLoading(true);

//     try {
//       let response;
//       if (isFollowing) {
//         response = await BusinessAPI.unfollowBusiness(providerId);
//       } else {
//         response = await BusinessAPI.followBusiness(providerId);
//       }

//       if (response.success) {
//         setIsFollowing(!isFollowing);
//         // Update the business profile follower count if available
//         if (businessProfile) {
//           setBusinessProfile(prev => ({
//             ...prev,
//             follower_count: isFollowing 
//               ? Math.max(0, prev.follower_count - 1)
//               : prev.follower_count + 1
//           }));
//         }
//         console.log('Follow action successful:', response.message); // Debug log
//       } else {
//         setError(response.error || 'Failed to update follow status');
//         console.error('Follow action failed:', response.error);
//       }
//     } catch (err) {
//       setError('Failed to update follow status');
//       console.error('Follow toggle error:', err);
//     } finally {
//       setFollowLoading(false);
//     }
//   };

//   const handleQuantityChange = (newQuantity) => {
//     if (newQuantity >= 1 && newQuantity <= item.quantity) {
//       setQuantity(newQuantity);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
//         <CustomerNavBar />
//         <div className="flex items-center justify-center min-h-[60vh]">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
//             <p className="text-gray-600 dark:text-gray-300">Loading food item details...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
//         <CustomerNavBar />
//         <div className="max-w-6xl mx-auto p-4 md:p-6">
//           <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 px-4 py-3 rounded-md">
//             <p className="font-medium">Error loading food item</p>
//             <p className="text-sm">{error}</p>
//             <button 
//               onClick={() => window.location.reload()}
//               className="mt-2 text-sm underline hover:no-underline"
//             >
//               Try again
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!item) {
//     return (
//       <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
//         <CustomerNavBar />
//         <div className="max-w-6xl mx-auto p-4 md:p-6">
//           <div className="text-center py-12">
//             <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Food Item Not Found</h2>
//             <p className="text-gray-600 dark:text-gray-300 mb-6">The food item you're looking for doesn't exist or has been removed</p>
//             <button
//               onClick={() => navigate('/food-listing')}
//               className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
//             >
//               Browse Food Items
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full">
//       <CustomerNavBar/>
//       <div className="max-w-6xl mx-auto p-4 md:p-6">
//         <div className="mb-6">
//           <Link to="/food-listing" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
//             &larr; Back to listings
//           </Link>
//         </div>

//         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
//           <div className="md:flex">
//             {/* Food Image */}
//             <div className="md:w-1/2">
//               <div className="relative">
//                 <img 
//                   src={item.images?.[0]} 
//                   alt={item.name} 
//                   className="w-full h-64 md:h-full object-cover" 
//                 />
//                 {!item.is_available && (
//                   <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md">
//                     Sold Out
//                   </div>
//                 )}
                
//                 {/* Follow Button - Positioned over the image */}
//                 <button
//                   onClick={handleFollowToggle}
//                   disabled={followLoading}
//                   className={`absolute top-4 left-4 p-3 rounded-full shadow-lg transition-all duration-200 ${
//                     isFollowing 
//                       ? 'bg-red-500 text-white hover:bg-red-600' 
//                       : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-red-500'
//                   } ${followLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
//                   title={isFollowing ? `Unfollow ${item.provider.businessName}` : `Follow ${item.provider.businessName}`}
//                 >
//                   <Heart 
//                     size={20} 
//                     fill={isFollowing ? 'currentColor' : 'none'}
//                     className={followLoading ? 'animate-pulse' : ''}
//                   />
//                 </button>
//               </div>
//             </div>

//             {/* Food Details */}
//             <div className="md:w-1/2 p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <FoodItemHeader 
//                   title={item.name} 
//                   provider={item.provider.businessName} 
//                   type={item.type} 
//                 />
//               </div>

//               {/* Business Info with Follow Button for Desktop
//               <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
//                 <div className="flex-1">
//                   <h3 className="font-medium text-gray-800">{item.provider.businessName}</h3>
//                   {businessProfile && (
//                     <p className="text-sm text-gray-600">
//                       {businessProfile.follower_count} {businessProfile.follower_count === 1 ? 'follower' : 'followers'}
//                     </p>
//                   )}
//                 </div>
                
//                 {/* Follow Button for Desktop */}
//                 {/* <button
//                   onClick={handleFollowToggle}
//                   disabled={followLoading}
//                   className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
//                     isFollowing
//                       ? 'bg-red-500 text-white hover:bg-red-600'
//                       : 'bg-emerald-600 text-white hover:bg-emerald-700'
//                   } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
//                 >
//                   <Heart 
//                     size={16} 
//                     fill={isFollowing ? 'currentColor' : 'none'}
//                     className={followLoading ? 'animate-pulse' : ''}
//                   />
//                   <span>
//                     {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
//                   </span>
//                 </button>
//               </div> } */} 

//               <p className="text-gray-700 mb-6">{item.description}</p>

//               <FoodItemDetails 
//                 pickupWindow={item.pickupWindow}
//                 address={item.provider.address}
//                 quantity={item.quantity}
//               />

//               <PriceDisplay 
//                 originalPrice={item.originalPrice} 
//                 discountedPrice={item.discountedPrice} 
//               />

//               <div className="space-y-4">
//                 <div className="flex items-center space-x-4">
//                   <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Quantity:</label>
//                   <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-md">
//                     <button
//                       onClick={() => handleQuantityChange(quantity - 1)}
//                       className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
//                       disabled={quantity <= 1}
//                     >
//                       -
//                     </button>
//                     <span className="px-4 py-1 text-gray-800 dark:text-gray-100">{quantity}</span>
//                     <button
//                       onClick={() => handleQuantityChange(quantity + 1)}
//                       className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
//                       disabled={quantity >= item.quantity}
//                     >
//                       +
//                     </button>
//                   </div>
//                 </div>

//                 {item.is_available && (
//                   <button
//                     onClick={handleAddToCart}
//                     disabled={buttonStatus === "loading"}
//                     className={`w-full py-3 ${
//                       buttonStatus === "added" ? "bg-emerald-800 dark:bg-emerald-900" : "bg-emerald-600 dark:bg-emerald-700"
//                     } text-white font-medium rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors flex items-center justify-center`}
//                   >
//                     <ShoppingCartIcon size={20} className="mr-2" />
//                     {buttonStatus === "idle" && "Add to Cart"}
//                     {buttonStatus === "loading" && "Adding..."}
//                     {buttonStatus === "added" && "View Cart"}
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>

//           <StoreLocation 
//           address={item.provider.address}
//           businessName={item.provider.businessName}
//           phone={item.provider.business_contact || item.provider.phone_number} 
//           hours={item.provider.business_hours}
//           coordinates={item.provider.coordinates} // Auto-calculated coordinates
//           openstreetmapUrl={item.provider.openstreetmap_url} // Pre-generated directions URL
//         />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FoodItem;


import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCartIcon, 
  Heart, 
  ArrowLeft,
  MapPin, 
  Clock, 
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FoodItemHeader from '../../components/auth/FoodItemHeader';
import FoodItemDetails from '../../components/auth/FoodItemDetails';
import PriceDisplay from '../../components/auth/PriceDisplay';
import StoreLocation from '../../components/auth/StoreLocation';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import foodAPI from '../../services/FoodAPI';
import BusinessAPI from '../../services/BusinessAPI';

const FoodItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [buttonStatus, setButtonStatus] = useState("idle");
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  useEffect(() => {
    if (item?.provider?.id) {
      fetchBusinessProfile();
    }
  }, [item]);

  const fetchItemDetails = async () => {
    try {
      const response = await foodAPI.getFoodListingDetails(id);
      if (response.success) {
        setItem(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load food item details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessProfile = async () => {
    try {
      const providerId = item.provider.user_id || item.provider.provider_id || item.provider.id;
      console.log('Fetching business profile for ID:', providerId);
      
      const response = await BusinessAPI.getBusinessProfile(providerId);
      if (response.success) {
        setBusinessProfile(response.data);
        setIsFollowing(response.data.is_following);
      } else {
        console.error('Business profile fetch failed:', response.error);
      }
    } catch (err) {
      console.error('Failed to fetch business profile:', err);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (buttonStatus === "added") {
      navigate('/cart');
      return;
    }

    setButtonStatus("loading");

    try {
      const response = await foodAPI.addToCart(id, quantity);
      if (response.success) {
        setButtonStatus("added");
        setTimeout(() => {
          navigate('/cart');
        }, 1500);
      } else {
        setError(response.error);
        setButtonStatus("idle");
      }
    } catch (err) {
      setError('Failed to add item to cart');
      setButtonStatus("idle");
    }
  };

  const handleFollowToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const providerId = item.provider.user_id || item.provider.provider_id || item.provider.id;
    console.log('Following/unfollowing business ID:', providerId);
    
    if (!providerId) {
      setError('Business information not available');
      return;
    }

    setFollowLoading(true);

    try {
      let response;
      if (isFollowing) {
        response = await BusinessAPI.unfollowBusiness(providerId);
      } else {
        response = await BusinessAPI.followBusiness(providerId);
      }

      if (response.success) {
        setIsFollowing(!isFollowing);
        if (businessProfile) {
          setBusinessProfile(prev => ({
            ...prev,
            follower_count: isFollowing 
              ? Math.max(0, prev.follower_count - 1)
              : prev.follower_count + 1
          }));
        }
        console.log('Follow action successful:', response.message);
      } else {
        setError(response.error || 'Failed to update follow status');
        console.error('Follow action failed:', response.error);
      }
    } catch (err) {
      setError('Failed to update follow status');
      console.error('Follow toggle error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= item.quantity) {
      setQuantity(newQuantity);
    }
  };

  const toggleExpand = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CustomerNavBar />

        <div className="max-w-4xl mx-auto px-4 pt-16 sm:pt-20">
    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center sm:text-left">
      <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Your Cart</span>
    </h1>
  </div>

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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Item</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <CustomerNavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-3">😕</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Item Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              The food item you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/food-listing')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Food Items
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
        {/* Back button */}
        <Link
          to="/food-listing"
          className="mb-4 flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to listings
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {/* Item header with image and basic info */}
          <div className="grid md:grid-cols-2 gap-6 p-5">
            {/* Image gallery */}
            <div className="relative overflow-hidden rounded-lg aspect-square bg-gray-100 dark:bg-gray-700">
              <img
                src={item.images?.[0]}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {!item.is_available && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Sold Out
                </div>
              )}
              
              {/* Follow Button - Positioned over the image */}
              {/* <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`absolute top-3 left-3 p-2 rounded-full shadow-lg transition-all duration-200 ${
                  isFollowing 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-red-500'
                } ${followLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                title={isFollowing ? `Unfollow ${item.provider.businessName}` : `Follow ${item.provider.businessName}`}
              >
               
              </button> */}
            </div>

            {/* Item details */}
            <div className="flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {item.name}
                    </h1>
                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{item.provider.businessName}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">{item.description}</p>

                <div className="mb-4">
                  <PriceDisplay 
                    originalPrice={item.originalPrice} 
                    discountedPrice={item.discountedPrice} 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Quantity:</label>
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                        <button
                          onClick={() => handleQuantityChange(quantity - 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors text-sm"
                          disabled={quantity <= 1}
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium text-sm">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(quantity + 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors text-sm"
                          disabled={quantity >= item.quantity}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.is_available && (
                    <button
                      onClick={handleAddToCart}
                      disabled={buttonStatus === "loading"}
                      className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                        buttonStatus === "added" 
                          ? "bg-emerald-800 dark:bg-emerald-900" 
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all`}
                    >
                      <ShoppingCartIcon className="h-4 w-4 mr-2" />
                      {buttonStatus === "idle" && "Add to Cart"}
                      {buttonStatus === "loading" && "Adding..."}
                      {buttonStatus === "added" && "View Cart"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for additional information */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {['Details', 'Reviews', 'Store Info'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                  className={`py-3 px-5 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab.toLowerCase().replace(' ', '')
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {activeTab === 'details' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">About this item</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description || 'No description available.'}</p>
                    
                    <FoodItemDetails 
                      pickupWindow={item.pickupWindow}
                      address={item.provider.address}
                      quantity={item.quantity}
                    />
                    
                    <div className="mt-4 space-y-3">
                      <div 
                        className="border-b border-gray-200 dark:border-gray-700 pb-2 cursor-pointer"
                        onClick={() => toggleExpand('ingredients')}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">Ingredients</h4>
                          {expandedSection === 'ingredients' ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        {expandedSection === 'ingredients' && (
                          <div className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                            <p>No ingredients information available.</p>
                          </div>
                        )}
                      </div>

                      <div 
                        className="border-b border-gray-200 dark:border-gray-700 pb-2 cursor-pointer"
                        onClick={() => toggleExpand('allergens')}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">Allergens</h4>
                          {expandedSection === 'allergens' ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        {expandedSection === 'allergens' && (
                          <div className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                            <p>No allergen information available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Customer Reviews</h3>
                    <div className="space-y-4">
                      {[1, 2, 3].map((review) => (
                        <div key={review} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                          <div className="flex items-center mb-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                              {review === 1 ? 'JD' : review === 2 ? 'AS' : 'MP'}
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                  {review === 1 ? 'John D.' : review === 2 ? 'Alice S.' : 'Mike P.'}
                                </h4>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {review === 1 ? '2 days ago' : review === 2 ? '1 week ago' : '2 weeks ago'}
                                </span>
                              </div>
                              <div className="flex items-center mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${star <= (review === 3 ? 4 : 5) ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 text-sm ml-11">
                            {review === 1 
                              ? 'Absolutely delicious! Will definitely order again.' 
                              : review === 2
                              ? 'Great value for money. The portion was generous and very tasty.'
                              : 'Good food, but delivery took longer than expected.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'storeinfo' && (
                  <div>
                    <StoreLocation 
                      address={item.provider.address}
                      businessName={item.provider.businessName}
                      phone={item.provider.business_contact || item.provider.phone_number} 
                      hours={item.provider.business_hours}
                      coordinates={item.provider.coordinates}
                      openstreetmapUrl={item.provider.openstreetmap_url}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 md:hidden z-50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                R{item.discountedPrice?.toFixed(2) || item.originalPrice?.toFixed(2)}
              </span>
              {item.discountedPrice && item.originalPrice > item.discountedPrice && (
                <span className="text-xs text-gray-400 line-through">
                  R{item.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          {item.is_available && (
            <button
              onClick={handleAddToCart}
              disabled={buttonStatus === "loading"}
              className="flex-1 ml-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-medium shadow-sm hover:from-emerald-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 text-sm"
            >
              {buttonStatus === "idle" && "Add to Cart"}
              {buttonStatus === "loading" && "Adding..."}
              {buttonStatus === "added" && "View Cart"}
            </button>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default FoodItem;