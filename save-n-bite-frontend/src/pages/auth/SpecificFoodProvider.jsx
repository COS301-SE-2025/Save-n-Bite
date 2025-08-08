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
} from 'lucide-react'

import ReviewsModal from '../../components/auth/ReviewModal'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import SearchBar from '../../components/auth/SearchBar'
import FilterSidebar from '../../components/auth/FilterSidebar'
import FoodListingsGrid from '../../components/auth/FoodListingsGrid'
import Sort from '../../components/auth/Sort'
import foodListingsAPI from '../../services/foodListingsAPI'
import { ThemeContext } from '../../context/ThemeContext' // Add ThemeContext import

// Mock data for a single provider
const provider = {
  id: 1,
  name: 'Sweet Bakery',
  image:
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
  logo: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
  address: '123 Main St, Eco City',
  phone: '071 123 4567',
  hours: 'Mon-Fri: 7am-7pm, Sat-Sun: 8am-6pm',
  rating: 4.8,
  reviews: 156,
  categories: ['Bakery', 'Pastries', 'Bread'],
}

// Mock data for provider's items
const providerItems = [
  {
    id: 1,
    title: 'Assorted Pastries Box',
    image:
      'https://images.unsplash.com/photo-1609950547346-a4f431435b2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 18.99,
    discountPrice: 7.99,
    type: 'discount',
    provider: 'Sweet Bakery'
  },
  {
    id: 2,
    title: 'Sourdough Bread Loaf',
    image:
      'https://images.unsplash.com/photo-1585478259715-4aa341a5ce8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 7.5,
    discountPrice: 3.5,
    type: 'discount',
    provider: 'Sweet Bakery'
  },
  {
    id: 3,
    title: 'Fresh Bread Assortment',
    image:
      'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 15.0,
    discountPrice: 6.0,
    type: 'discount',
    provider: 'Sweet Bakery'
  },
  {
    id: 4,
    title: 'Chocolate Croissants (4)',
    image:
      'https://images.unsplash.com/photo-1623334044303-241021148842?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 12.0,
    discountPrice: 5.0,
    type: 'discount',
    provider: 'Sweet Bakery'
  },
  {
    id: 5,
    title: 'Artisan Bagels (6)',
    image:
      'https://images.unsplash.com/photo-1585478259069-4a3278c17f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 10.99,
    discountPrice: 0,
    type: 'donation',
    provider: 'Sweet Bakery'
  },
]

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

const FoodProviderDetailPage = () => {
  const { id } = useParams()
  const { theme } = useContext(ThemeContext) // Use ThemeContext
  const [isFollowing, setIsFollowing] = useState(false)
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    priceRange: [0, 20],
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

  const isCustomer = () => userType === 'customer'
  const isNGO = () => userType === 'ngo'

  const filterListingsByUserType = (listings) => {
    if (!Array.isArray(listings)) return []
    
    const currentUserType = foodListingsAPI.getUserType()
    
    switch(currentUserType) {
      case 'customer':
        return listings.filter(listing => 
          listing?.type?.toLowerCase() === 'discount'
        )
      case 'ngo':
        return listings.filter(listing => {
          const type = listing?.type?.toLowerCase()
          return type === 'discount' || type === 'donation'
        })
      default:
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


  const processProviderItems = () => {
    setLoading(true)
    
    // Simulate API call delay
    setTimeout(() => {
      setAllFoodListings(providerItems)
      
      const currentUserType = foodListingsAPI.getUserType()
      setUserType(currentUserType)
      
      const filtered = filterListingsByUserType(providerItems)
      setFilteredListings(filtered)
      setTotalCount(filtered.length)
      setLoading(false)
    }, 300)
  }

  
  const applyFiltersAndSearch = () => {
    let filtered = [...allFoodListings]
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (filters.type !== 'all') {
      filtered = filtered.filter(item =>
        item.type.toLowerCase() === filters.type.toLowerCase()
      )
    }
    

    const price = filters.type === 'Donation' ? 0 : filtered.discountPrice || 0
    filtered = filtered.filter(item => {
      const itemPrice = item.type === 'donation' ? 0 : item.discountPrice
      return itemPrice >= filters.priceRange[0] && itemPrice <= filters.priceRange[1]
    })
    

    const userFiltered = filterListingsByUserType(filtered)
    
    // Apply sorting
    if (selectedSort) {
      userFiltered.sort((a, b) => {
        switch(selectedSort) {
          case 'price-low':
            return (a.discountPrice || 0) - (b.discountPrice || 0)
          case 'price-high':
            return (b.discountPrice || 0) - (a.discountPrice || 0)
          case 'name':
            return a.title.localeCompare(b.title)
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

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  const openReviewsModal = () => {
    setIsReviewsModalOpen(true)
  }

  const closeReviewsModal = () => {
    setIsReviewsModalOpen(false)
  }

  // Initialize data on component mount
  useEffect(() => {
    processProviderItems()
  }, [])


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

  if (loading && filteredListings.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
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

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
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

        {/* Provider Header */}
        <div className="relative mb-8">
          <div className="h-64 w-full rounded-t-lg overflow-hidden">
            <img
              src={provider.image}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm p-6 md:p-8 transition-colors duration-300">
            <div className="flex flex-col md:flex-row">
              <div className="md:flex-grow">
                <div className="flex items-start">
                  <div className="relative -mt-16 mr-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-900 shadow-sm">
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                      {provider.name}
                    </h1>
                    <div className="flex items-center mt-1 text-sm">
                      <div className="flex items-center text-amber-500">
                        <StarIcon size={16} className="fill-current" />
                        <span className="ml-1">{provider.rating}</span>
                      </div>
                      <button 
                        className="ml-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium"
                        onClick={openReviewsModal}
                      >
                        Read Reviews
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <MapPinIcon size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">
                      {provider.address}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">
                      {provider.phone}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">
                      {provider.hours}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {provider.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-4 md:flex md:flex-col md:justify-center">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-md flex items-center justify-center transition-colors ${
                    isFollowing 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800'
                  }`}
                >
                  <HeartIcon
                    size={18}
                    className={`mr-2 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  {isFollowing ? 'Following' : 'Follow'}
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
          {showFilters && (
  <FilterSidebar 
    showFilters={showFilters}
    filters={filters}
    setFilters={setFilters}
    providerOptions={[{ value: provider.id, label: provider.name }]}
    typeOptions={getAvailableTypeFilters()}
    onResetFilters={handleResetFilters}
  />
)}

          
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {loading ? 'Loading...' : `${totalCount} items available from ${provider.name}`}
              </div>
              <Sort 
                selectedSort={selectedSort} 
                setSelectedSort={setSelectedSort} 
              />
            </div>
            
            {loading && filteredListings.length > 0 && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-200 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  Updating listings...
                </div>
              </div>
            )}
            
            <FoodListingsGrid listings={filteredListings} />
            
            
            {!loading && filteredListings.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">No items available</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {userType === 'customer' 
                    ? 'No discounted items available from this provider right now'
                    : 'No items available from this provider right now'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={closeReviewsModal}
        providerName={provider.name}
        providerRating={provider.rating}
        totalReviews={provider.reviews}
        reviews={providerReviews}
      />
    </div>
  )
}

export default FoodProviderDetailPage