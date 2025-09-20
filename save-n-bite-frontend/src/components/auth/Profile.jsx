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
  ClockIcon,
  CheckCircleIcon,
  TrendingUpIcon,
  UsersIcon,
  LeafIcon,
  ChevronRightIcon
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
  const [activeTab, setActiveTab] = useState('orders');

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
        setError(result.error || 'Failed to unfollow business');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Error unfollowing business:', err);
      setError('Failed to unfollow business. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-emerald-500 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <XIcon className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error loading profile</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const userDetails = profileData.user_details || {};
  const orderStats = profileData.order_statistics || {};
  const impactStats = profileData.impact_statistics || {};
  const reviews = Array.isArray(profileData.reviews) ? profileData.reviews : [];
  const followedBusinesses = profileData.followed_businesses || { businesses: [], count: 0 };

  const StatCard = ({ icon, value, label, color = 'emerald' }) => (
    <div className={`bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50 transition-all duration-300 hover:shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
        <div className={`p-2 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-500`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <CustomerNavBar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1> */}

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {userDetails?.first_name || 'User'}
            </h1>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 mb-8 transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <img
                src={userDetails.profile_image || PLACEHOLDER_AVATAR}
                alt={userDetails.full_name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = PLACEHOLDER_AVATAR;
                }}
              />
            
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {userDetails.full_name}
                  </h2>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {userDetails.profile_type}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  {userDetails.verification_status}
                </span>
              </div>
              
              <div className="space-y-1.5 text-sm">
                <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center sm:justify-start">
                  <span className="w-5 mr-2 text-gray-400">✉️</span>
                  {userDetails.email}
                </p>
                {userDetails.phone_number && (
                  <p className="text-gray-600 dark:text-gray-300 flex items-center justify-center sm:justify-start">
                    <span className="w-5 mr-2 text-gray-400">📱</span>
                    {userDetails.phone_number}
                  </p>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  <ClockIcon size={14} className="inline mr-1.5" />
                  Member since {userDetails.member_since}
                </p>
              </div>
              
              {/* Edit Profile Button - Moved here */}
              <div className="mt-4 w-full sm:w-auto">
                <Link
                  to="/edit-profile"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <EditIcon size={16} className="mr-2" />
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={<ShoppingBagIcon size={20} />} 
            value={orderStats?.total_orders || 0} 
            label="Total Orders"
            color="purple"
          />
          <StatCard 
            icon={<CheckCircleIcon size={20} />} 
            value={orderStats?.completed_orders || 0} 
            label="Completed"
            color="emerald"
          />
          <StatCard 
            icon={<UsersIcon size={20} />} 
            value={followedBusinesses?.count || 0} 
            label="Following"
            color="blue"
          />
          <StatCard 
            icon={<StarIcon size={20} />} 
            value={reviews?.length || 0} 
            label="Reviews"
            color="amber"
          />
        </div>

        {/* Impact Section */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/10 rounded-2xl p-6 mb-8 border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  <LeafIcon size={20} />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Your Environmental Impact
                </h3>
              </div>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                Thank you for being a sustainability champion! Your contributions are making a difference.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 min-w-[280px]">
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700/50">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {impactStats?.total_meals_rescued || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Meals Rescued</p>
              </div>
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700/50">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {impactStats?.total_co2_prevented_kg?.toFixed(1) || '0.0'}kg
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">CO₂ Prevented</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {['orders', 'Followed Foodproviders', 'reviews'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {activeTab === 'orders' && (
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Order History
              </h3>
              <div className="text-center py-12">
                <ShoppingBagIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders yet</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Your order history will appear here once you've made your first purchase.
                </p>
                <Link
                  to="/food-listing"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Browse Food Listings
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Foodproviders you follow
              </h3>
              <div className="text-center py-12">
                <HeartIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved items</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Save your favorite food items to access them easily later.
                </p>
                <Link
                  to="/food-listing"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Browse Food Listings
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Your Reviews
              </h3>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-6 border-b border-gray-100 dark:border-gray-700/50 last:border-0 last:pb-0 last:mb-0">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mr-3">
                          <UserIcon size={16} className="text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {review.business_name}
                            </h4>
                            <span className="text-xs text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                size={16}
                                className={`${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} mr-0.5`}
                                fill={i < review.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {review.comment || 'No review text provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <StarIcon size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reviews yet</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Your reviews will appear here once you've left feedback for businesses.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;