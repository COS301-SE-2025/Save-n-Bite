import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  EditIcon,
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  XIcon,
  Loader,
  UserIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ShieldIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomerNavBar from './CustomerNavBar';
import ProfileAPI from '../../services/ProfileAPI';
import BusinessAPI from '../../services/BusinessAPI';

// Placeholder image for users without profile pictures
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileAPI = new ProfileAPI();
        const result = await profileAPI.getMyProfile();

        if (result.success) {
          setProfileData(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUnfollow = async (businessId) => {
    try {
      const businessAPI = new BusinessAPI();
      const result = await businessAPI.unfollowBusiness(businessId);

      if (result.success) {
        // Update UI only if the API call was successful
        if (profileData?.followed_businesses?.businesses) {
          const updatedBusinesses = profileData.followed_businesses.businesses.filter(
            (business) => business.id !== businessId
          );
          setProfileData(prev => ({
            ...prev,
            followed_businesses: {
              ...prev.followed_businesses,
              businesses: updatedBusinesses,
              count: updatedBusinesses.length
            }
          }));
        }
      } else {
        // Show error if unfollow failed
        setError(result.error || 'Failed to unfollow business');
        setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
      }
    } catch (err) {
      console.error('Error unfollowing business:', err);
      setError('Failed to unfollow business. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Helper function to get verification status display
  const getVerificationStatusDisplay = (status, userType) => {
    if (userType === 'customer') {
      return {
        text: 'Verified',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: <ShieldCheckIcon className="h-4 w-4" />
      };
    }

    switch (status) {
      case 'verified':
        return {
          text: 'Verified',
          className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: <ShieldCheckIcon className="h-4 w-4" />
        };
      case 'pending_verification':
        return {
          text: 'Pending Verification',
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          icon: <ShieldIcon className="h-4 w-4" />
        };
      case 'rejected':
        return {
          text: 'Verification Rejected',
          className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: <ShieldIcon className="h-4 w-4" />
        };
      default:
        return {
          text: 'Not Verified',
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: <ShieldIcon className="h-4 w-4" />
        };
    }
  };

  // Helper function to render user type specific information
  const renderUserTypeInfo = (userDetails) => {
    switch (userDetails.user_type) {
      case 'customer':
        return (
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <UserIcon className="h-4 w-4 mr-2" />
              <span>Individual Consumer</span>
            </div>
          </div>
        );
      
      case 'ngo':
        return (
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <BuildingIcon className="h-4 w-4 mr-2" />
              <span>Non-Profit Organization</span>
            </div>
            {userDetails.organisation_name && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <span className="text-sm">Organization: {userDetails.organisation_name}</span>
              </div>
            )}
            {userDetails.organisation_contact && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">{userDetails.organisation_contact}</span>
              </div>
            )}
            {userDetails.organisation_email && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MailIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">{userDetails.organisation_email}</span>
              </div>
            )}
          </div>
        );
      
      case 'provider':
        return (
          <div className="space-y-2">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <BuildingIcon className="h-4 w-4 mr-2" />
              <span>Food Provider</span>
            </div>
            {userDetails.business_name && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <span className="text-sm">Business: {userDetails.business_name}</span>
              </div>
            )}
            {userDetails.business_contact && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">{userDetails.business_contact}</span>
              </div>
            )}
            {userDetails.business_address && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPinIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">{userDetails.business_address}</span>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-200">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full transition-colors duration-200">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const userDetails = profileData.user_details;
  const orderStats = profileData.order_statistics;
  const impactStats = profileData.impact_statistics;
  const reviews = profileData.reviews;
  const followedBusinesses = profileData.followed_businesses;
  const verificationStatus = getVerificationStatusDisplay(
    userDetails.verification_status, 
    userDetails.user_type
  );

  // Get profile image based on user type
  const getProfileImage = () => {
    if (userDetails.user_type === 'customer' && userDetails.profile_image) {
      return userDetails.profile_image;
    } else if (userDetails.user_type === 'ngo' && userDetails.organisation_logo) {
      return userDetails.organisation_logo;
    } else if (userDetails.user_type === 'provider' && userDetails.logo) {
      return userDetails.logo;
    }
    return PLACEHOLDER_AVATAR;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full transition-colors duration-200">
      <CustomerNavBar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          My Profile
        </h1>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="relative mb-4 sm:mb-0">
              <img
                src={getProfileImage()}
                alt={userDetails.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-sm"
              />
            </div>
            <div className="sm:ml-6 text-center sm:text-left flex-grow">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {userDetails.full_name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                {userDetails.email}
              </p>
              {userDetails.phone_number && (
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {userDetails.phone_number}
                </p>
              )}
              
              {/* User type specific info */}
              <div className="mb-2">
                {renderUserTypeInfo(userDetails)}
              </div>

              {/* Verification Status */}
              <div className="flex items-center justify-center sm:justify-start mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${verificationStatus.className}`}>
                  {verificationStatus.icon}
                  <span className="ml-1">{verificationStatus.text}</span>
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Member since {userDetails.member_since}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                to="/edit-profile"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
              >
                <EditIcon size={16} className="mr-2" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Impact Snapshot - Only show for customers and NGOs who have orders */}
        {(userDetails.user_type === 'customer' || userDetails.user_type === 'ngo') && 
         orderStats && orderStats.total_orders > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                  You've rescued {impactStats.total_meals_rescued || 0} meals in total!
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  That's approximately {impactStats.total_co2_prevented_kg || 0} kg of CO2 emissions prevented
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <button
            className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('profile')}
          >
            Overview
          </button>
          {/* Only show provider tab for customers and NGOs */}
          {(userDetails.user_type === 'customer' || userDetails.user_type === 'ngo') && (
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'providers' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('providers')}
            >
              Followed Providers
            </button>
          )}
          {/* Show reviews tab for all user types */}
          <button
            className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'reviews' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('reviews')}
          >
            My Reviews
          </button>
        </div>

        {/* Content */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Account Overview
            </h3>

            {/* Order Statistics - Only for customers and NGOs */}
            {(userDetails.user_type === 'customer' || userDetails.user_type === 'ngo') && orderStats && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Order Statistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full mr-3">
                        <ShoppingBagIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Completed Orders
                        </p>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white">
                          {orderStats.completed_orders || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full mr-3">
                        <ShoppingBagIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cancelled Orders
                        </p>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white">
                          {orderStats.cancelled_orders || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full mr-3">
                        <ShoppingBagIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Missed Pickups
                        </p>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white">
                          {orderStats.missed_pickups || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <Link
                    to="/orders"
                    className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    View Order History
                  </Link>
                </div>
              </div>
            )}

            {/* Provider-specific content could go here */}
            {userDetails.user_type === 'provider' && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Business Information
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    Business profile management features coming soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Followed Providers Tab - Only for customers and NGOs */}
        {(userDetails.user_type === 'customer' || userDetails.user_type === 'ngo') && 
         activeTab === 'providers' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Followed Providers ({followedBusinesses?.count || 0})
            </h3>
            {followedBusinesses?.businesses && followedBusinesses.businesses.length > 0 ? (
              <div className="space-y-4">
                {followedBusinesses.businesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center">
                      <img
                        src={business.logo || PLACEHOLDER_AVATAR}
                        alt={business.business_name}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {business.business_name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {business.business_address}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Following since {business.followed_since}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className={`px-2 py-1 rounded-full text-xs mr-3 ${business.status === 'verified'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}>
                        {business.status}
                      </span>
                      <button
                        onClick={() => handleUnfollow(business.id)}
                        className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        <XIcon size={14} className="mr-1" />
                        Unfollow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-full mb-4">
                  <HeartIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No Followed Providers
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't followed any food providers yet.
                </p>
                <Link
                  to="/providers"
                  className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                >
                  Browse Providers
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              My Reviews ({reviews?.count || 0})
            </h3>
            {reviews?.recent_reviews && reviews.recent_reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.recent_reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium text-gray-800 dark:text-white">
                        {review.business_name}
                      </h4>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-4 w-4 ${i < (review.general_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.general_comment && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        {review.general_comment}
                      </p>
                    )}
                    {review.food_review && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        <span className="font-medium">Food:</span> {review.food_review}
                      </p>
                    )}
                    {review.business_review && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                        <span className="font-medium">Service:</span> {review.business_review}
                      </p>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {review.created_at}
                      </span>
                      {review.review_source && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          via {review.review_source}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-full mb-4">
                  <StarIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No Reviews Yet
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't written any reviews yet.
                </p>
                <Link
                  to="/orders"
                  className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-md hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                >
                  View Orders to Review
                </Link>
              </div>
            )}

            {reviews?.statistics && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total reviews: <span className="font-medium">{reviews.statistics.total_reviews || 0}</span>
                  {reviews.statistics.average_rating_given > 0 && (
                    <span className="ml-4">
                      Average rating given: <span className="font-medium">{reviews.statistics.average_rating_given}/5</span>
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;