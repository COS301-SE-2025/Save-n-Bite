import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPinIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  PhoneIcon,
  GlobeIcon,
  ShoppingCartIcon,
} from 'lucide-react'

import ReviewsModal from '../../components/auth/ReviewModal'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import SearchBar from '../../components/auth/SearchBar'
import FilterSidebar from '../../components/auth/FilterSidebar'
import FoodListingsGrid from '../../components/auth/FoodListingsGrid'
import Sort from '../../components/auth/Sort'
import foodListingsAPI from '../../services/foodListingsAPI'
import FoodProvidersAPI, { getApiBaseUrl } from '../../services/FoodProvidersAPI'
import BusinessAPI from '../../services/BusinessAPI'
import reviewsAPI from '../../services/reviewsAPI'

const providerReviews = [
  {
    id: 1,
    userName: 'Emily Johnson',
    userImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'June 12, 2023',
    comment:
      'The pastries from Sweet Bakery are absolutely delicious! I picked up their discounted assortment box and everything was still incredibly fresh. Great way to enjoy quality baked goods while reducing food waste.',
    helpful: 24,
    isHelpful: true,
  },
  {
    id: 2,
    userName: 'Michael Chen',
    userImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 4,
    date: 'May 30, 2023',
    comment:
      "I'm a regular customer at Sweet Bakery. Their sourdough bread is exceptional, and being able to get it at a discount at the end of the day is a bonus. The staff is always friendly and helpful.",
    helpful: 15,
    isHelpful: false,
  },
  {
    id: 3,
    userName: 'Sophia Rodriguez',
    userImage:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'June 5, 2023',
    comment:
      "The chocolate croissants are to die for! I appreciate that Sweet Bakery is committed to reducing food waste. The app makes it easy to see what's available and when to pick it up.",
    helpful: 18,
    isHelpful: false,
  },
  {
    id: 4,
    userName: 'David Kim',
    userImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 3,
    date: 'May 22, 2023',
    comment:
      "Good selection of baked goods. Sometimes items sell out quickly, so you have to be fast. The quality is generally good, though I've had a few items that weren't as fresh as expected.",
    helpful: 7,
    isHelpful: false,
  },
  {
    id: 5,
    userName: 'Olivia Martinez',
    userImage:
      'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'June 8, 2023',
    comment:
      'I love that I can support a local business while also helping reduce food waste. The artisan bagels are amazing and such a great deal through this app. Highly recommend!',
    helpful: 22,
    isHelpful: true,
  },
]

const SpecificFoodProvider = () => {
  const { id } = useParams()
  const [provider, setProvider] = useState(null)
  const [providerLoading, setProviderLoading] = useState(true)
  const [providerError, setProviderError] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)
  const [reviews, setReviews] = useState(providerReviews) // Start with mock data
  const [reviewsLoading, setReviewsLoading] = useState(false)
  
  // Reused state from FoodListings
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    priceRange: [0, 10000],
    expiration: 'all',
    type: 'all',
    provider: 'all'
  })
  const [selectedSort, setSelectedSort] = useState('')
  
  const [allFoodListings, setAllFoodListings] = useState([])
  const [filteredListings, setFilteredListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [userType, setUserType] = useState('customer')

  // Load provider data from API
  useEffect(() => {
    const loadProvider = async () => {
      if (!id) return
      
      try {
        setProviderLoading(true)
        const result = await FoodProvidersAPI.getProviderById(id)
        
        if (result.success && result.data?.provider) {
          setProvider(result.data.provider)
          setIsFollowing(result.data.provider.is_following || false)
          setProviderError(null)
          
          // Load reviews for this provider
          loadProviderReviews(result.data.provider.id)
        } else {
          setProviderError(result.error || 'Provider not found')
        }
      } catch (err) {
        setProviderError('An unexpected error occurred while loading provider details')
        console.error('Error loading provider:', err)
      } finally {
        setProviderLoading(false)
      }
    }

    loadProvider()
  }, [id])

  // Load reviews for the provider
  const loadProviderReviews = async (providerId) => {
    try {
      setReviewsLoading(true)
      const result = await reviewsAPI.getPublicBusinessReviews(providerId, {
        page: 1,
        page_size: 10,
        sort: 'newest'
      })
      
      if (result.success && result.data?.reviews) {
        setReviews(result.data.reviews)
      } else {
        console.log('No reviews found or API not ready, using mock data')
        // Keep using mock data if API is not ready
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      // Keep using mock data on error
    } finally {
      setReviewsLoading(false)
    }
  }
  const getProviderImage = (provider, type = 'banner') => {
    if (!provider) return 'https://images.unsplash.com/photo-1555507036-ab794f575c5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    
    const baseUrl = getApiBaseUrl()
    const imagePath = type === 'banner' ? provider.banner : provider.logo
    
    if (imagePath) {
      if (imagePath.startsWith('http')) {
        return imagePath
      }
      return `${baseUrl}${imagePath}`
    }
    
    // Fallback images based on type
    if (type === 'banner') {
      return 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    } else {
      return 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
    }
  }
 
  const isCustomer = () => userType === 'customer'
  const isNGO = () => userType === 'ngo'

  const filterListingsByUserType = (listings) => {
    if (!Array.isArray(listings)) return []
    
    const currentUserType = foodListingsAPI.getUserType()
    
    switch(currentUserType) {
      case 'customer':
        // Customers only see discounted items (price > 0)
        return listings.filter(listing => 
          listing?.type?.toLowerCase() === 'discount' ||
          (listing.discountPrice && listing.discountPrice > 0) ||
          (listing.discountedPrice && listing.discountedPrice > 0)
        )
      case 'ngo':
        // NGOs see both discounted items and donations
        return listings.filter(listing => {
          const type = listing?.type?.toLowerCase()
          return type === 'discount' || 
                 type === 'donation' ||
                 listing.discountPrice >= 0 || 
                 listing.discountedPrice >= 0
        })
      default:
        // Default to showing all listings
        return listings
    }
  }

  const getAvailableTypeFilters = () => {
    const currentUserType = foodListingsAPI.getUserType()
    
    const options = [
      { value: 'all', label: 'All Items' },
      { value: 'Discount', label: 'Discounted' } 
    ]
    
    if (currentUserType === 'ngo') {
      options.push({ value: 'Donation', label: 'Donations' })
    }
    
    return options
  }

  const processProviderItems = async () => {
    if (!provider) return
    
    setLoading(true)
    
    try {
      // Get all food listings and filter by this provider
      const result = await foodListingsAPI.getFoodListings()
      
      if (result.success && result.data?.listings) {
        // Filter listings to only show items from this specific provider
        const providerListings = result.data.listings.filter(listing => {
          // Check if the listing belongs to this provider
          return listing.provider?.id === provider.id || 
                 listing.provider_name === provider.business_name ||
                 listing.provider?.business_name === provider.business_name
        })
        
        console.log('All listings:', result.data.listings.length)
        console.log('Provider listings:', providerListings.length)
        console.log('Filtering for provider:', provider.business_name, provider.id)
        
        setAllFoodListings(providerListings)
        
        const currentUserType = foodListingsAPI.getUserType()
        setUserType(currentUserType)
        
        const filtered = filterListingsByUserType(providerListings)
        setFilteredListings(filtered)
        setTotalCount(filtered.length)
      } else {
        console.error('Failed to fetch listings:', result.error)
        // Fallback to empty array if API fails
        setAllFoodListings([])
        setFilteredListings([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Error fetching provider listings:', error)
      // Fallback to empty array on error
      setAllFoodListings([])
      setFilteredListings([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSearch = () => {
    let filtered = [...allFoodListings]
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.provider_name && item.provider_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => {
        const itemType = item.type?.toLowerCase()
        const filterType = filters.type.toLowerCase()
        
        if (filterType === 'discount') {
          // Use transformed field names (camelCase)
          return itemType === 'discount' || (item.discountedPrice > 0 || item.discountPrice > 0)
        } else if (filterType === 'donation') {
          return itemType === 'donation' || (item.discountedPrice === 0 && item.discountPrice === 0)
        }
        return itemType === filterType
      })
    }
    
    // Apply price range filter
    filtered = filtered.filter(item => {
      // Use transformed field names (camelCase)
      const itemPrice = item.discountedPrice || item.discountPrice || 0
      return itemPrice >= filters.priceRange[0] && itemPrice <= filters.priceRange[1]
    })
    
    // Apply user type filtering
    const userFiltered = filterListingsByUserType(filtered)
    
    // Apply sorting
    if (selectedSort) {
      userFiltered.sort((a, b) => {
        switch(selectedSort) {
          case 'price-low':
            // Use transformed field names (camelCase)
            return (a.discountedPrice || a.discountPrice || 0) - (b.discountedPrice || b.discountPrice || 0)
          case 'price-high':
            return (b.discountedPrice || b.discountPrice || 0) - (a.discountedPrice || a.discountPrice || 0)
          case 'name':
            return (a.title || a.name || '').localeCompare(b.title || b.name || '')
          case 'expiry':
            return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0)
          default:
            return 0
        }
      })
    }
    
    setFilteredListings(userFiltered)
    setTotalCount(userFiltered.length)
  }

  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 20],
      expiration: 'all',
      type: 'all',
      provider: 'all'
    })
    setSearchQuery('')
    setSelectedSort('')
  }

  const handleFollow = async () => {
    if (followLoading || !provider) return
    
    try {
      setFollowLoading(true)
      const businessAPI = new BusinessAPI()
      
      let result
      if (isFollowing) {
        // Unfollow the business
        result = await businessAPI.unfollowBusiness(provider.id)
      } else {
        // Follow the business
        result = await businessAPI.followBusiness(provider.id)
      }
      
      if (result.success) {
        setIsFollowing(!isFollowing)
        
        // Update provider's follower count
        setProvider(prev => ({
          ...prev,
          follower_count: isFollowing 
            ? (prev.follower_count || 0) - 1 
            : (prev.follower_count || 0) + 1
        }))
        
        // Optional: Show success message
        console.log(result.message || (isFollowing ? 'Unfollowed successfully' : 'Following successfully'))
      } else {
        console.error('Follow/Unfollow failed:', result.error)
        // Optional: Show error message to user
      }
    } catch (error) {
      console.error('Error during follow/unfollow:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const openReviewsModal = () => {
    setIsReviewsModalOpen(true)
  }

  const closeReviewsModal = () => {
    setIsReviewsModalOpen(false)
  }

  // Initialize data on component mount
  useEffect(() => {
    if (provider) {
      processProviderItems()
    }
  }, [provider])

  useEffect(() => {
    if (allFoodListings.length > 0) {
      const debounceTimer = setTimeout(() => {
        applyFiltersAndSearch()
      }, 300)
      
      return () => clearTimeout(debounceTimer)
    }
  }, [filters, searchQuery, selectedSort, allFoodListings])

  useEffect(() => {
    if (allFoodListings.length > 0) {
      const currentUserType = foodListingsAPI.getUserType()
      setUserType(currentUserType)
      
      applyFiltersAndSearch()
    }
  }, [allFoodListings])

  // Loading state
  if (providerLoading) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading provider details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (providerError || !provider) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="mb-6">
            <Link
              to="/providers"
              className="text-emerald-600 hover:text-emerald-700"
            >
              &larr; Back to providers
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">
              {providerError || 'Provider not found'}
            </p>
            <Link 
              to="/providers"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Back to Providers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <CustomerNavBar />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <Link
            to="/providers"
            className="text-emerald-600 hover:text-emerald-700"
          >
            &larr; Back to providers
          </Link>
        </div>

        {/* Provider Header */}
        <div className="relative mb-8">
          <div className="h-64 w-full rounded-t-lg overflow-hidden">
            <img
              src={getProviderImage(provider, 'banner')}
              alt={provider.business_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
              }}
            />
          </div>
          <div className="bg-white rounded-b-lg shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row">
              <div className="md:flex-grow">
                <div className="flex items-start">
                  <div className="relative -mt-16 mr-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm">
                      <img
                        src={getProviderImage(provider, 'logo')}
                        alt={provider.business_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {provider.business_name}
                    </h1>
                    <div className="flex items-center mt-1 text-sm">
                      <div className="flex items-center text-amber-500">
                        <StarIcon size={16} className="fill-current" />
                        <span className="ml-1">{provider.rating || 4.5}</span>
                      </div>
                      <button 
                        className="ml-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        onClick={openReviewsModal}
                      >
                        Read Reviews
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {provider.business_address && (
                    <div className="flex items-center">
                      <MapPinIcon size={16} className="text-gray-500 mr-2" />
                      <span className="text-gray-600 text-sm">
                        {provider.business_address}
                      </span>
                    </div>
                  )}
                  {provider.business_contact && (
                    <div className="flex items-center">
                      <PhoneIcon size={16} className="text-gray-500 mr-2" />
                      <span className="text-gray-600 text-sm">
                        {provider.business_contact}
                      </span>
                    </div>
                  )}
                  {provider.business_hours && (
                    <div className="flex items-center">
                      <ClockIcon size={16} className="text-gray-500 mr-2" />
                      <span className="text-gray-600 text-sm">
                        {provider.business_hours}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {provider.business_tags && provider.business_tags.length > 0 ? (
                    provider.business_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      Food Provider
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-4 md:flex md:flex-col md:justify-center">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-md flex items-center justify-center transition-colors ${
                    followLoading
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isFollowing 
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {followLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                      {isFollowing ? 'Unfollowing...' : 'Following...'}
                    </>
                  ) : (
                    <>
                      <HeartIcon
                        size={18}
                        className={`mr-2 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {isFollowing ? 'Following' : 'Follow'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
        
        <br />

        <div className="flex flex-col md:flex-row gap-6">
          <FilterSidebar 
            showFilters={showFilters}
            filters={filters}
            setFilters={setFilters}
            providerOptions={[{ value: provider.id, label: provider.business_name }]}
            typeOptions={getAvailableTypeFilters()}
            onResetFilters={handleResetFilters}
          />
          
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${totalCount} items available from ${provider.business_name}`}
              </div>
              <Sort 
                selectedSort={selectedSort} 
                setSelectedSort={setSelectedSort} 
              />
            </div>
            
            {loading && filteredListings.length > 0 && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  Updating listings...
                </div>
              </div>
            )}
            
            <FoodListingsGrid listings={filteredListings} />
            
            {!loading && filteredListings.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-xl text-gray-600 mb-4">No items available</p>
                <p className="text-gray-500">
                  {allFoodListings.length === 0 
                    ? `${provider.business_name} hasn't posted any food listings yet.`
                    : userType === 'customer' 
                      ? 'No discounted items available from this provider right now'
                      : 'No items match your current filters'
                  }
                </p>
                {allFoodListings.length > 0 && (
                  <button 
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={closeReviewsModal}
        providerName={provider.business_name}
        providerRating={provider.rating || 4.5}
        totalReviews={reviews.length}
        reviews={reviews}
        loading={reviewsLoading}
      />
    </div>
  )
}

export default SpecificFoodProvider