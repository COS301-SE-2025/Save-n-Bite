import React, { useState, useEffect, useContext } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPinIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  PhoneIcon,
  GlobeIcon,
  ShoppingCartIcon,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft
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
import { ThemeContext } from '../../context/ThemeContext' 



const SpecificFoodProvider = () => {
  const { id } = useParams()
  const [provider, setProvider] = useState(null)
  const [providerLoading, setProviderLoading] = useState(true)
  const [providerError, setProviderError] = useState(null)
  const { theme } = useContext(ThemeContext) // Use ThemeContext

  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewsData, setReviewsData] = useState(null) // Store full reviews response
  
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
          
          // Load reviews for this provider using the provider ID
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

  // Transform API review data to match the expected format for the modal
  const transformReviewData = (apiReview) => {
    // Generate a placeholder image based on reviewer name
    const getPlaceholderImage = (name) => {
      const avatarUrls = [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
        'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
      ]
      // Use the first letter of name to determine which avatar to use
      const index = name ? name.charCodeAt(0) % avatarUrls.length : 0
      return avatarUrls[index]
    }

    return {
      id: apiReview.id,
      userName: apiReview.reviewer_info,
      userImage: getPlaceholderImage(apiReview.reviewer_info),
      rating: apiReview.general_rating,
      date: apiReview.time_ago,
      comment: apiReview.general_comment || apiReview.food_review || 'No comment provided',
      helpful: Math.floor(Math.random() * 30), // Random helpful count since API doesn't provide this
      isHelpful: Math.random() > 0.5 // Random helpful status
    }
  }

  // Load reviews for the provider using the new API
  const loadProviderReviews = async (providerId) => {
    try {
      setReviewsLoading(true)
      const result = await reviewsAPI.getProviderReviews(providerId, {
        page: 1,
        page_size: 20, // Get more reviews
        sort: 'newest'
      })
      
      if (result.success && result.data?.results) {
        const { results } = result.data
        setReviewsData(results) // Store full response data
        
        if (results.reviews && results.reviews.length > 0) {
          // Transform API reviews to match expected format
          const transformedReviews = results.reviews.map(transformReviewData)
          setReviews(transformedReviews)
          
          // Update provider rating with real data
          if (results.reviews_summary?.average_rating) {
            setProvider(prev => ({
              ...prev,
              rating: results.reviews_summary.average_rating
            }))
          }
        } else {
          console.log('No reviews found, using fallback data')
          setReviews(fallbackReviews)
        }
      } else {
        console.log('Failed to fetch reviews or API not ready, using fallback data')
        setReviews(fallbackReviews)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      setReviews(fallbackReviews) // Use fallback on error
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

  // Get rating and review count from API data or fallback
  const getProviderRating = () => {
    if (reviewsData?.reviews_summary?.average_rating) {
      return reviewsData.reviews_summary.average_rating
    }
    return provider?.rating || 0
  }

  const getTotalReviews = () => {
    if (reviewsData?.reviews_summary?.total_reviews) {
      return reviewsData.reviews_summary.total_reviews
    }
    return reviews.length
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
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading provider details...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (providerError || !provider) {
    return (
      <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="mb-6">
            <Link
              to="/providers"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen w-full transition-colors duration-300">
      <CustomerNavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Link
          to="/providers"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 mb-6 transition-colors duration-200"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to providers
        </Link>

        {/* Provider Header */}
        <div className="relative mb-8 overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="h-72 w-full overflow-hidden bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
            <img
              src={getProviderImage(provider, 'banner')}
              alt={provider.business_name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
              }}
            />
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-start">
              {/* Provider Logo */}
              <div className="relative -mt-20 md:-mt-24 mb-6 md:mb-0 md:mr-8">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg bg-white dark:bg-gray-700">
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
              
              {/* Provider Info */}
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {provider.business_name}
                    </h1>
                    
                    <div className="flex items-center mb-4">
                      <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-sm font-medium">
                        <StarIcon size={16} className="fill-current mr-1" />
                        <span>{getProviderRating().toFixed(1)}</span>
                        <span className="mx-1">•</span>
                        <button 
                          onClick={openReviewsModal}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
                        >
                          {getTotalReviews()} reviews
                        </button>
                      </div>
                      
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`ml-3 px-4 py-2 rounded-full flex items-center text-sm font-medium transition-all ${
                          followLoading
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : isFollowing 
                              ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 text-white'
                        }`}
                      >
                        {followLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                            {isFollowing ? 'Unfollowing...' : 'Following...'}
                          </>
                        ) : (
                          <>
                            <HeartIcon
                              size={16}
                              className={`mr-2 ${isFollowing ? 'fill-red-500 text-red-500' : 'text-white'}`}
                            />
                            {isFollowing ? 'Following' : 'Follow'}
                          </>
                        )}
                      </button>
                    </div>
                    
                    {provider.business_description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {provider.business_description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {provider.business_tags?.length > 0 ? (
                        provider.business_tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-100 dark:border-gray-600"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-100 dark:border-gray-600">
                          Food Provider
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  {provider.business_address && (
                    <div className="flex items-start">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg mr-3">
                        <MapPinIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Address</h4>
                        <p className="text-gray-700 dark:text-gray-200 text-sm">
                          {provider.business_address}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {provider.business_contact && (
                    <div className="flex items-start">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                        <PhoneIcon size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Contact</h4>
                        <p className="text-gray-700 dark:text-gray-200 text-sm">
                          {provider.business_contact}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {provider.business_hours && (
                    <div className="flex items-start">
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg mr-3">
                        <ClockIcon size={18} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hours</h4>
                        <p className="text-gray-700 dark:text-gray-200 text-sm">
                          {provider.business_hours}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300">
            <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-grow max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for meals, cuisines, or ingredients..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <select
                    value={selectedSort || ''}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 cursor-pointer text-sm font-medium"
                  >
                    <option value="">Sort by</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="expiry">Expiry Date</option>
                    <option value="newest">Newest First</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${
                    showFilters || selectedSort
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600/50'
                  }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          {allFoodListings.length > 0 && (
            <FilterSidebar 
              showFilters={showFilters}
              filters={filters}
              setFilters={setFilters}
              providerOptions={[{ value: provider.id, label: provider.business_name }]}
              typeOptions={getAvailableTypeFilters()}
              onResetFilters={handleResetFilters}
            />
          )}
          
          <div className="flex-grow">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-200 rounded-lg text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  Loading listings...
                </div>
              </div>
            ) : filteredListings.length > 0 ? (
              <FoodListingsGrid listings={filteredListings} />
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCartIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No items available
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {allFoodListings.length === 0 
                      ? `${provider.business_name} hasn't posted any food listings yet.`
                      : 'No items match your current filters.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <ReviewsModal
          isOpen={isReviewsModalOpen}
          onClose={closeReviewsModal}
          providerName={provider.business_name}
          providerRating={getProviderRating()}
          totalReviews={getTotalReviews()}
          reviews={reviews}
          loading={reviewsLoading}
          reviewsData={reviewsData}
        />
      </div>
    </div>
  )
}

export default SpecificFoodProvider