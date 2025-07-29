import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  EditIcon,
  ShoppingBagIcon,
  HeartIcon,
  StarIcon,
  BuildingIcon,
  CheckCircleIcon,
  FileTextIcon,
  XIcon,
  AlertTriangleIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import CustomerNavBar from './CustomerNavBar';


const mockUserData = {
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  phone: '072 123 4567',
  address: '123 Green Street, Randburg, Gauteng, 0086',
  avatar:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
  userType: 'customer',
  joinDate: 'August 2022',
  gardenStats: {
    totalPlants: 5,
    plantsGrown: 2,
    co2Reduced: 15.5,
    level: 3,
    lastPickup: '2023-08-15',
    mealsRescued: 12,
  },
  orderStats: {
    completed: 15,
    canceled: 2,
    missed: 1,
  },
  reviews: [
    {
      id: 1,
      providerName: 'Sweet Bakery',
      rating: 5,
      date: '2023-08-10',
      comment: 'Great pastries and excellent service!',
    },
    {
      id: 2,
      providerName: 'Green Grocers',
      rating: 4,
      date: '2023-07-28',
      comment: 'Fresh produce and friendly staff.',
    },
  ],
  followedProviders: [
    {
      id: 1,
      name: 'Sweet Bakery',
      image:
        'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    },
    {
      id: 2,
      name: 'Green Grocers',
      image:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    },
    {
      id: 3,
      name: 'Farm Fresh',
      image:
        'https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    },
  ],
};

const ProfilePage = () => {
  const { user: authUser } = useAuth();

  const [user, setUser] = useState({
    ...mockUserData,
    ...(authUser || {}),
  });

  const [activeTab, setActiveTab] = useState('profile');

  const handleUnfollow = (providerId) => {
    const updatedProviders = user.followedProviders.filter(
      (provider) => provider.id !== providerId
    );
    setUser((prev) => ({
      ...prev,
      followedProviders: updatedProviders,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-200">
              <CustomerNavBar/>
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          My Profile
        </h1>
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="relative mb-4 sm:mb-0">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-sm"
              />
              {/* <span className="absolute bottom-0 right-0 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-medium px-2 py-1 rounded-full border border-white dark:border-gray-700">
                {user.userType === 'customer' ? '🎯 Customer' : '🤝 NGO'}
              </span> */}
            </div>
            <div className="sm:ml-6 text-center sm:text-left flex-grow">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {user.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                {user.email}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                {user.phone}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {user.address}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-1">
                {user.bio}
            </p>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Member since {user.joinDate}
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
                You've rescued {user.gardenStats.mealsRescued} meals this month!
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                That's approximately {user.gardenStats.co2Reduced} kg of CO2
                emissions prevented
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
          {user.userType === 'customer' && (
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'providers' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('providers')}
            >
              Followed Providers
            </button>
          )}
          {user.userType === 'customer' && (
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'reviews' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('reviews')}
            >
              My Reviews
            </button>
          )}
          {user.userType === 'ngo' && (
            <button
              className={`px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'organization' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('organization')}
            >
              Organization
            </button>
          )}
        </div>
        {/* Content */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Account Overview
            </h3>
            {/* Order Stats for Customer */}
            {user.userType === 'customer' && (
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
                          {user.orderStats.completed}
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
                          Canceled Orders
                        </p>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white">
                          {user.orderStats.canceled}
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
                          {user.orderStats.missed}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Donation Stats for NGO */}
            {user.userType === 'ngo' && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Donation Statistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <ShoppingBagIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Requested Donations
                        </p>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white">
                          {user.organization.donationStats.requested}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full mr-3">
                        <ShoppingBagIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Received Donations
                        </p>
                        <p className="text-xl font-semibold text-gray-800 dark:text-white">
                          {user.organization.donationStats.received}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
        {activeTab === 'providers' && user.userType === 'customer' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Followed Providers
            </h3>
            {user.followedProviders.length > 0 ? (
              <div className="space-y-4">
                {user.followedProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center">
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                      />
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">
                          {provider.name}
                        </h4>
                        <Link
                          to={`/providers/${provider.id}`}
                          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          View Provider
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleUnfollow(provider.id)}
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
        {activeTab === 'reviews' && user.userType === 'customer' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              My Reviews
            </h3>
            <div className="space-y-4">
              {user.reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {review.providerName}
                    </h4>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    {review.comment}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {review.date}
                    </span>
                    {/* <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                      Edit Review
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
            {user.reviews.length === 0 && (
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
          </div>
        )}
        {activeTab === 'organization' && user.userType === 'ngo' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              Organization Details
            </h3>
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mission Statement
              </h4>
              <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {user.organization.mission}
              </p>
            </div>
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                  Verification Status
                </h4>
                <span
                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${user.organization.verificationStatus === 'verified' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' : user.organization.verificationStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}
                >
                  {user.organization.verificationStatus === 'verified' && (
                    <span className="flex items-center">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  )}
                  {user.organization.verificationStatus === 'pending' &&
                    'Pending'}
                  {user.organization.verificationStatus === 'rejected' &&
                    'Rejected'}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Uploaded Documents
                </h5>
                <div className="space-y-2">
                  {user.organization.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-600 last:border-0"
                    >
                      <div className="flex items-center">
                        <FileTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {doc.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                          Uploaded: {doc.date}
                        </span>
                        <button className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
                          Re-upload
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default ProfilePage
 
