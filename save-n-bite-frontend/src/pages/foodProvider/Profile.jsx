import React, { useState, useRef, useEffect } from 'react'
import { Edit2Icon, CheckIcon, XIcon, Menu, Loader } from 'lucide-react'
import SideBar from '../../components/foodProvider/SideBar';
import ProfileAPI from '../../services/ProfileAPI';

function ProfilePage() {
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const bannerInputRef = useRef(null)
  const logoInputRef = useRef(null)

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const profileAPI = new ProfileAPI()
        const result = await profileAPI.getMyProfile()
        
        if (result.success) {
          setProfileData(result.data)
          // Initialize form data from API response
          const apiData = result.data.user_details
          setFormData({
            businessName: apiData.full_name,
            email: apiData.email,
            phone: apiData.phone_number || '',
            // Set default images if not available
            bannerUrl: apiData.profile_picture || 'https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            logoUrl: apiData.profile_image || 'https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            verificationStatus: apiData.verification_status === 'verified' ? 'Verified' : 'Pending'
          })
          setError(null)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load profile data')
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUpdateLoading(true)
    
    try {
      const profileAPI = new ProfileAPI()
      const updateData = {
        full_name: formData.businessName,
        phone_number: formData.phone,
      }
      
      const result = await profileAPI.updateProfile(updateData)
      
      if (result.success) {
        setIsEditing(false)
        // Refresh profile data
        const updatedProfile = await profileAPI.getMyProfile()
        if (updatedProfile.success) {
          setProfileData(updatedProfile.data)
          // Update form data with new values
          const apiData = updatedProfile.data.user_details
          setFormData({
            ...formData,
            businessName: apiData.full_name,
            phone: apiData.phone_number || '',
          })
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to update profile')
      console.error('Update error:', err)
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleImageChange = async (e, type) => {
    const file = e.target.files[0]
    if (file) {
      try {
        setUpdateLoading(true)
        
        if (type === 'logoUrl') {
          // For profile picture, create FormData and update via API
          const formData = new FormData()
          formData.append('profile_image', file)
          
          const profileAPI = new ProfileAPI()
          const result = await profileAPI.updateProfile(formData)
          
          if (result.success) {
            // Refresh profile to get updated image URL
            const updatedProfile = await profileAPI.getMyProfile()
            if (updatedProfile.success) {
              setProfileData(updatedProfile.data)
              setFormData(prev => ({
                ...prev,
                logoUrl: updatedProfile.data.user_details.profile_image || prev.logoUrl
              }))
            }
          } else {
            setError(result.error)
          }
        } else {
          // For banner, just preview locally since API doesn't support banner upload yet
          const reader = new FileReader()
          reader.onloadend = () => {
            setFormData(prev => ({
              ...prev,
              [type]: reader.result,
            }))
          }
          reader.readAsDataURL(file)
        }
      } catch (err) {
        setError('Failed to update image')
        console.error('Image update error:', err)
      } finally {
        setUpdateLoading(false)
      }
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="w-full flex min-h-screen">
        <div className="hidden md:flex">
          <SideBar onNavigate={() => {}} currentPage="foodprovider-profile" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !profileData) {
    return (
      <div className="w-full flex min-h-screen">
        <div className="hidden md:flex">
          <SideBar onNavigate={() => {}} currentPage="foodprovider-profile" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex min-h-screen">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">
        <SideBar onNavigate={() => {}} currentPage="foodprovider-profile" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={toggleMobileSidebar}
          />
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 z-50">
            <SideBar 
              onNavigate={() => setIsMobileSidebarOpen(false)} 
              currentPage="foodprovider-profile"
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
          <div className="w-10" />
        </div>

        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Banner Section */}
          <div className="relative h-48 sm:h-64 rounded-lg overflow-hidden mb-6 sm:mb-8 bg-blue-100">
            <img
              src={formData.bannerUrl}
              alt="Profile Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
              <div className="p-4 sm:p-6 text-white">
                <h2 className="text-xl sm:text-3xl font-bold">{profileData?.user_details?.full_name || 'Your Profile'}</h2>
                <p className="text-sm sm:text-base opacity-90">{profileData?.user_details?.profile_type || 'Individual Consumer'}</p>
              </div>
            </div>
            <button
              onClick={() => bannerInputRef.current.click()}
              disabled={updateLoading}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50"
            >
              {updateLoading ? <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <Edit2Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-900" />}
            </button>
            <input
              type="file"
              accept="image/*"
              ref={bannerInputRef}
              style={{ display: 'none' }}
              onChange={(e) => handleImageChange(e, 'bannerUrl')}
            />
          </div>

          {/* Profile Info Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <h3 className="text-lg sm:text-xl font-semibold">Profile Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center sm:justify-start text-sm sm:text-base"
                  >
                    <Edit2Icon className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSubmit}
                      disabled={updateLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center text-sm sm:text-base disabled:opacity-50"
                    >
                      {updateLoading ? <Loader className="h-4 w-4 mr-2 animate-spin" /> : <CheckIcon className="h-4 w-4 mr-2" />}
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form data
                        const apiData = profileData.user_details
                        setFormData(prev => ({
                          ...prev,
                          businessName: apiData.full_name,
                          phone: apiData.phone_number || '',
                        }))
                      }}
                      disabled={updateLoading}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center justify-center text-sm sm:text-base disabled:opacity-50"
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center mb-6 relative">
                <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gray-200 rounded-full overflow-hidden mb-4 sm:mb-0 sm:mr-6 mx-auto sm:mx-0">
                  <img
                    src={formData.logoUrl}
                    alt="Profile Picture"
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  onClick={() => logoInputRef.current.click()}
                  disabled={updateLoading}
                  className="absolute left-1/2 transform -translate-x-1/2 top-14 sm:left-16 sm:top-16 sm:transform-none bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-colors disabled:opacity-50"
                >
                  {updateLoading ? <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Edit2Icon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-900" />}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageChange(e, 'logoUrl')}
                />
                <div className="text-center sm:text-left">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-xs sm:text-sm">
                    {formData.verificationStatus === 'Verified' ? (
                      <span className="flex items-center">
                        <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-600" />
                        Verified User
                      </span>
                    ) : formData.verificationStatus === 'Pending' ? (
                      <span className="text-yellow-600">Verification Pending</span>
                    ) : (
                      <span className="text-red-600">Verification Required</span>
                    )}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">Member since {profileData?.user_details?.member_since}</p>
                </div>
              </div>

              {isEditing ? (
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base bg-gray-50"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm sm:text-base"
                    />
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                      <p className="text-sm sm:text-base">{profileData?.user_details?.full_name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Email Address</h4>
                      <p className="text-sm sm:text-base break-words">{profileData?.user_details?.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                      <p className="text-sm sm:text-base">{profileData?.user_details?.phone_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">User Type</h4>
                      <p className="text-sm sm:text-base capitalize">{profileData?.user_details?.user_type}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Statistics Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Order Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">Completed Orders</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {profileData?.order_statistics?.completed_orders || 0}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">Total Orders</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {profileData?.order_statistics?.total_orders || 0}
                  </p>
                </div>
                <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">Cancelled Orders</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    {profileData?.order_statistics?.cancelled_orders || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">Missed Pickups</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                    {profileData?.order_statistics?.missed_pickups || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Statistics Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Environmental Impact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">Total Meals Rescued</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {profileData?.impact_statistics?.total_meals_rescued || 0}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">CO₂ Prevented (kg)</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {profileData?.impact_statistics?.total_co2_prevented_kg || 0}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-500">Reviews Written</h4>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                    {profileData?.reviews?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Reviews Section */}
          {profileData?.reviews?.recent_reviews?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Recent Reviews ({profileData.reviews.count})
                </h3>
                <div className="space-y-3">
                  {profileData.reviews.recent_reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{review.business_name}</h4>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < review.general_rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.general_comment && (
                        <p className="text-sm text-gray-600 mb-1">{review.general_comment}</p>
                      )}
                      {review.food_review && (
                        <p className="text-sm text-gray-600 mb-1">Food: {review.food_review}</p>
                      )}
                      {review.business_review && (
                        <p className="text-sm text-gray-600 mb-1">Business: {review.business_review}</p>
                      )}
                      <p className="text-xs text-gray-500">{review.created_at}</p>
                    </div>
                  ))}
                </div>
                {profileData.reviews.statistics && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Average rating given: {profileData.reviews.statistics.average_rating_given}/5
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Followed Businesses Section */}
          {profileData?.followed_businesses?.businesses?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 sm:mb-8">
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Followed Businesses ({profileData.followed_businesses.count})
                </h3>
                <div className="space-y-3">
                  {profileData.followed_businesses.businesses.map((business) => (
                    <div key={business.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{business.business_name}</h4>
                        <p className="text-sm text-gray-600">{business.business_address}</p>
                        <p className="text-xs text-gray-500">Following since {business.followed_since}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        business.status === 'verified' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {business.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage;