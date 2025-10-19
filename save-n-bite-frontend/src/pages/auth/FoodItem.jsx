


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
  ChevronUp,
  User,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FoodItemHeader from '../../components/auth/FoodItemHeader';
import FoodItemDetails from '../../components/auth/FoodItemDetails';
import PriceDisplay from '../../components/auth/PriceDisplay';
import StoreLocation from '../../components/auth/StoreLocation';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import foodAPI from '../../services/FoodAPI';
import BusinessAPI from '../../services/BusinessAPI';
import FoodProvidersAPI from '../../services/FoodProvidersAPI';
import reviewsAPI from '../../services/reviewsAPI';

// Error Popup Component
const ErrorPopup = ({ error, onClose }) => {
  if (!error) return null;

  // Default user-friendly message
  let userMessage = "Something went wrong. Please try again.";

  // If error is a string
  if (typeof error === "string") {
    userMessage = "Sorry, this item cannot be added to your cart.";
  } 
  // If AxiosError with response
  else if (error.response) {
    const status = error.response.status;
    const apiMessage = error.response.data?.message;

    // Override for specific backend message
    if (apiMessage === "Failed to add item to cart") {
      userMessage = "Sorry, this item cannot be added to your cart.";
    } else if (status === 400) {
      userMessage = "Sorry, this item cannot be added to your cart.";
    } else if (status === 401) {
      userMessage = "You must be logged in to perform this action.";
    } else if (status >= 500) {
      userMessage = "Server is having issues. Please try again later.";
    } else if (apiMessage) {
      userMessage = apiMessage;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Oops!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{userMessage}</p>
        <div className="flex justify-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            Close
          </button>
          {/* <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button> */}
        </div>
      </div>
    </div>
  );
};


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
  const [isInCart, setIsInCart] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsError, setReviewsError] = useState(null);

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  useEffect(() => {
    console.log('=== USEEFFECT DEBUG ===');
    console.log('item:', item);
    console.log('item?.provider (full object):', JSON.stringify(item?.provider, null, 2));
    console.log('item?.provider?.id:', item?.provider?.id);
    console.log('item?.provider?.user_id:', item?.provider?.user_id);
    console.log('item?.provider?.provider_id:', item?.provider?.provider_id);
    console.log('item?.provider?.businessName:', item?.provider?.businessName);
    
    if (item?.provider) {
      console.log('Provider exists, calling fetchBusinessProfile and fetchProviderReviews');
      fetchBusinessProfile();
      fetchProviderReviews();
    } else {
      console.log('NOT calling review functions - provider missing');
    }
    console.log('=== END USEEFFECT DEBUG ===');
  }, [item]);

  const fetchItemDetails = async () => {
    try {
      const response = await foodAPI.getFoodListingDetails(id);
      if (response.success) {
        const itemData = response.data;
        
        // TEMPORARY FIX: If provider doesn't have user_id, try to fetch it
        if (itemData.provider && !itemData.provider.user_id && !itemData.provider.provider_id) {
          console.log('Provider missing IDs, attempting to fetch from provider API');
          
          // Try to get the provider details using business name
          try {
            const allProvidersResponse = await FoodProvidersAPI.getAllProviders();
            if (allProvidersResponse.success && allProvidersResponse.data?.providers) {
              const matchingProvider = allProvidersResponse.data.providers.find(
                p => p.business_name === itemData.provider.businessName
              );
              
              if (matchingProvider) {
                console.log('Found matching provider:', matchingProvider);
                // Add the missing IDs to the provider object
                itemData.provider.user_id = matchingProvider.user_id || matchingProvider.id;
                itemData.provider.provider_id = matchingProvider.id;
                console.log('Updated provider with IDs:', itemData.provider);
              }
            }
          } catch (err) {
            console.error('Failed to fetch provider details:', err);
          }
        }
        
        setItem(itemData);
      } else {
        setError(response.error || 'Failed to load food item details');
      }
    } catch (err) {
      setError(err);
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

  // Transform API review data to match the expected format
  const transformReviewData = (apiReview) => {
    const getPlaceholderImage = (name) => {
      const avatarUrls = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
      ];
      const index = name ? name.charCodeAt(0) % avatarUrls.length : 0;
      return avatarUrls[index];
    };

    return {
      id: apiReview.id,
      userName: apiReview.reviewer_info,
      userImage: getPlaceholderImage(apiReview.reviewer_info),
      rating: apiReview.general_rating,
      date: apiReview.time_ago,
      comment: apiReview.general_comment || apiReview.food_review || 'No comment provided',
      helpful: Math.floor(Math.random() * 30),
      isHelpful: Math.random() > 0.5,
      original: apiReview
    };
  };

  const fetchProviderReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      
      console.log('=== DEBUGGING PROVIDER REVIEWS ===');
      console.log('Full item object:', item);
      console.log('Provider object:', item.provider);
      
      let providerId = item.provider.user_id || item.provider.provider_id || item.provider.id || item.provider.UserID;
      
      if (!providerId && item.provider.businessName) {
        console.log('No direct provider ID found, trying to fetch by business name:', item.provider.businessName);
        
        try {
          const providerResult = await FoodProvidersAPI.getProviderByName(item.provider.businessName);
          if (providerResult.success && providerResult.data?.provider?.id) {
            providerId = providerResult.data.provider.id;
            console.log('Found provider ID via business name lookup:', providerId);
          }
        } catch (err) {
          console.log('Failed to lookup provider by name:', err);
        }
      }
      
      console.log('Final provider ID to use:', providerId);
      
      if (!providerId) {
        setReviewsError('No valid provider ID found - backend needs to return provider.user_id');
        console.error('No valid provider ID found');
        return;
      }
      
      const response = await reviewsAPI.getProviderReviews(providerId, {
        page: 1,
        page_size: 20,
        sort: 'newest'
      });
      
      console.log('API response:', response);
      
      if (response.success && response.data?.results) {
        const { results } = response.data;
        setReviewsData(results);
        
        if (results.reviews && results.reviews.length > 0) {
          const transformedReviews = results.reviews.map(transformReviewData);
          setReviews(transformedReviews);
          console.log('Successfully loaded and transformed reviews:', transformedReviews.length);
        } else {
          setReviews([]);
        }
      } else {
        setReviewsError(response.error || 'Failed to load reviews');
        setReviews([]);
      }
    } catch (err) {
      console.error('Exception during review fetch:', err);
      setReviewsError('Failed to load reviews: ' + err.message);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (buttonStatus === "View Cart") {
      navigate('/cart');
      return;
    }

    setButtonStatus("loading");

    try {
      const response = await foodAPI.addToCart(id, quantity);
      if (response.success) {
        setButtonStatus("View Cart");
      } else {
        setError(response.error || 'Failed to add item to cart');
        setButtonStatus("idle");
      }
    } catch (err) {
      setError(err);
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
      setError(err);
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

  const renderStarRating = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatReviewerName = (reviewerInfo) => {
    if (!reviewerInfo) return 'Anonymous';
    const parts = reviewerInfo.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1].charAt(0)}.`;
    }
    return reviewerInfo;
  };

  const renderReviewsTab = () => {
    if (reviewsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading reviews...</span>
        </div>
      );
    }

    if (reviewsError) {
      return (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">Unable to load reviews</p>
          <p className="text-sm text-gray-400">{reviewsError}</p>
          <button
            onClick={fetchProviderReviews}
            className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      );
    }

    if (!reviews || reviews.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Reviews Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Be the first to review {item?.provider?.businessName || 'this provider'}!
          </p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Customer Reviews</h3>
          {reviewsData?.reviews_summary && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-lg font-semibold text-gray-900 dark:text-white">
                    {reviewsData.reviews_summary.average_rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({reviewsData.reviews_summary.total_reviews} {reviewsData.reviews_summary.total_reviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                      {review.userName ? review.userName.charAt(0).toUpperCase() : 'A'}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {formatReviewerName(review.userName)}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {review.date}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    {renderStarRating(review.rating)}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      {review.rating}/5
                    </span>
                    {review.original?.interaction_summary && (
                      <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">
                        • {review.original.interaction_summary.type} • R{review.original.interaction_summary.total_amount}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {review.original?.general_comment && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <span className="font-medium">Overall: </span>
                        {review.original.general_comment}
                      </p>
                    )}
                    {review.original?.food_review && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <span className="font-medium">Food: </span>
                        {review.original.food_review}
                      </p>
                    )}
                    {review.original?.business_review && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        <span className="font-medium">Service: </span>
                        {review.original.business_review}
                      </p>
                    )}
                    {!review.original?.general_comment && !review.original?.food_review && !review.original?.business_review && review.comment && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {reviewsData?.pagination_info?.total_count > reviews.length && (
          <div className="text-center mt-6">
            <button
              onClick={() => {
                console.log('Load more reviews');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
       <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-200">Loading...</p>
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
      
      {/* Error Popup */}
      <ErrorPopup error={error} onClose={() => setError(null)} />
      
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
                      {buttonStatus === "View Cart" && "View Cart"}
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/food-listing')}
                    className="w-full sm:w-auto flex-1 inline-flex items-center flex-center px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                  >
                    Continue Browsing
                  </button>
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
                  onClick={() => {
                    console.log('Tab clicked:', tab.toLowerCase().replace(' ', ''));
                    setActiveTab(tab.toLowerCase().replace(' ', ''));
                  }}
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

                {activeTab === 'reviews' && renderReviewsTab()}

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
    </div>
  );
};

export default FoodItem;