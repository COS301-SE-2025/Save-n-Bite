import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import FoodItemHeader from '../../components/auth/FoodItemHeader';
import FoodItemDetails from '../../components/auth/FoodItemDetails';
import PriceDisplay from '../../components/auth/PriceDisplay';
import RelatedItems from '../../components/auth/RelatedItems';
import StoreLocation from '../../components/auth/StoreLocation';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import { ShoppingCartIcon, Heart } from 'lucide-react';
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
  
  // Follow functionality state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);

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
      // The API expects the provider's user ID, which might be different from provider.id
      // Check if we have provider.user_id or provider.provider_id first
      const providerId = item.provider.user_id || item.provider.provider_id || item.provider.id;
      console.log('Fetching business profile for ID:', providerId); // Debug log
      
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

    // Get the correct provider ID
    const providerId = item.provider.user_id || item.provider.provider_id || item.provider.id;
    console.log('Following/unfollowing business ID:', providerId); // Debug log
    
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
        // Update the business profile follower count if available
        if (businessProfile) {
          setBusinessProfile(prev => ({
            ...prev,
            follower_count: isFollowing 
              ? Math.max(0, prev.follower_count - 1)
              : prev.follower_count + 1
          }));
        }
        console.log('Follow action successful:', response.message); // Debug log
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

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading food item details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading food item</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline hover:no-underline"
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
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Food Item Not Found</h2>
            <p className="text-gray-600 mb-6">The food item you're looking for doesn't exist or has been removed</p>
            <button
              onClick={() => navigate('/food-listing')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Browse Food Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <CustomerNavBar/>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <Link to="/food-listing" className="text-emerald-600 hover:text-emerald-700">
            &larr; Back to listings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="md:flex">
            {/* Food Image */}
            <div className="md:w-1/2">
              <div className="relative">
                <img 
                  src={item.images?.[0]} 
                  alt={item.name} 
                  className="w-full h-64 md:h-full object-cover" 
                />
                {!item.is_available && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md">
                    Sold Out
                  </div>
                )}
                
                {/* Follow Button - Positioned over the image */}
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`absolute top-4 left-4 p-3 rounded-full shadow-lg transition-all duration-200 ${
                    isFollowing 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-red-500'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  title={isFollowing ? `Unfollow ${item.provider.businessName}` : `Follow ${item.provider.businessName}`}
                >
                  <Heart 
                    size={20} 
                    fill={isFollowing ? 'currentColor' : 'none'}
                    className={followLoading ? 'animate-pulse' : ''}
                  />
                </button>
              </div>
            </div>

            {/* Food Details */}
            <div className="md:w-1/2 p-6">
              <div className="flex items-center justify-between mb-4">
                <FoodItemHeader 
                  title={item.name} 
                  provider={item.provider.businessName} 
                  type={item.type} 
                />
              </div>

              {/* Business Info with Follow Button for Desktop */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{item.provider.businessName}</h3>
                  {businessProfile && (
                    <p className="text-sm text-gray-600">
                      {businessProfile.follower_count} {businessProfile.follower_count === 1 ? 'follower' : 'followers'}
                    </p>
                  )}
                </div>
                
                {/* Follow Button for Desktop */}
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isFollowing
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Heart 
                    size={16} 
                    fill={isFollowing ? 'currentColor' : 'none'}
                    className={followLoading ? 'animate-pulse' : ''}
                  />
                  <span>
                    {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                  </span>
                </button>
              </div>

              <p className="text-gray-700 mb-6">{item.description}</p>

              <FoodItemDetails 
                pickupWindow={item.pickupWindow}
                address={item.provider.address}
                quantity={item.quantity}
              />

              <PriceDisplay 
                originalPrice={item.originalPrice} 
                discountedPrice={item.discountedPrice} 
              />

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-1">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      disabled={quantity >= item.quantity}
                    >
                      +
                    </button>
                  </div>
                </div>

                {item.is_available && (
                  <button
                    onClick={handleAddToCart}
                    disabled={buttonStatus === "loading"}
                    className={`w-full py-3 ${
                      buttonStatus === "added" ? "bg-emerald-800" : "bg-emerald-600"
                    } text-white font-medium rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center`}
                  >
                    <ShoppingCartIcon size={20} className="mr-2" />
                    {buttonStatus === "idle" && "Add to Cart"}
                    {buttonStatus === "loading" && "Adding..."}
                    {buttonStatus === "added" && "View Cart"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <StoreLocation address={item.provider.address} />
        </div>
      </div>
    </div>
  );
};

export default FoodItem;