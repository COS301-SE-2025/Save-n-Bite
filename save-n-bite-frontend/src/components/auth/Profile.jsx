import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  EditIcon,
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  XIcon,
  Loader,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomerNavBar from './CustomerNavBar';
import ProfileAPI from '../../services/ProfileAPI';

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
    // TODO: Implement unfollow API call
    // For now, just update the UI
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
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full transition-colors duration-200">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
            <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
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
                src={userDetails.profile_image || PLACEHOLDER_AVATAR}
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
                <p className="text-gray-600 dark:text-gray-300 mb-1">
                  {userDetails.phone_number}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {userDetails.profile_type} • {userDetails.verification_status}
              </p>
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

        {/* Impact Snapshot */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                You've rescued {impactStats.total_meals_rescued} meals in total!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                That's approximately {impactStats.total_co2_prevented_kg} kg of CO2 emissions prevented
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <button
            className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('profile')}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'providers' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
            onClick={() => setActiveTab('providers')}
          >
            Followed Providers
          </button>
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
            
            {/* Order Statistics */}
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
                        {orderStats.completed_orders}
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
                        {orderStats.cancelled_orders}
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
                        {orderStats.missed_pickups}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Link
                to="/orders"
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                View Order History
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'providers' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Followed Providers ({followedBusinesses.count})
            </h3>
            {followedBusinesses.businesses && followedBusinesses.businesses.length > 0 ? (
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
                      <span className={`px-2 py-1 rounded-full text-xs mr-3 ${
                        business.status === 'verified' 
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

        {activeTab === 'reviews' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              My Reviews ({reviews.count})
            </h3>
            {reviews.recent_reviews && reviews.recent_reviews.length > 0 ? (
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
                            className={`h-4 w-4 ${i < review.general_rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
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
                <p className="text-gray-500 dark:text-gray-400">
                  You haven't written any reviews yet.
                </p>
              </div>
            )}
            
            {reviews.statistics && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average rating given: <span className="font-medium">{reviews.statistics.average_rating_given}/5</span>
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