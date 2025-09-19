import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, MapPin, Filter, X, Loader2, ArrowRight } from 'lucide-react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import FoodProvidersAPI, { getApiBaseUrl } from '../../services/FoodProvidersAPI'
import reviewsAPI from '../../services/reviewsAPI'

const FoodProvidersPage = () => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [providersWithReviews, setProvidersWithReviews] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  // Load providers from API
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true)
        const result = await FoodProvidersAPI.getAllProviders()
        
        if (result.success && result.data?.providers) {
          setProviders(result.data.providers)
          setError(null)
          await loadProvidersReviewData(result.data.providers)
        } else {
          setError(result.error || 'Failed to load providers')
        }
      } catch (err) {
        setError('An unexpected error occurred while loading providers')
        console.error('Error loading providers:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProviders()
  }, [])

  // Load review data for all providers
  const loadProvidersReviewData = async (providersList) => {
    try {
      const providersWithReviewData = await Promise.all(
        providersList.map(async (provider) => {
          try {
            const reviewResult = await reviewsAPI.getProviderReviews(provider.id, {
              page: 1,
              page_size: 1
            })
            
            if (reviewResult.success && reviewResult.data?.results) {
              const { reviews_summary } = reviewResult.data.results
              return {
                ...provider,
                rating: reviews_summary?.average_rating || provider.rating || 0,
                total_reviews: reviews_summary?.total_reviews || 0,
                rating_distribution: reviews_summary?.rating_distribution || null
              }
            }
            return {
              ...provider,
              rating: provider.rating || 0,
              total_reviews: 0,
              rating_distribution: null
            }
          } catch (error) {
            console.error(`Error loading reviews for provider ${provider.business_name}:`, error)
            return {
              ...provider,
              rating: provider.rating || 0,
              total_reviews: 0,
              rating_distribution: null
            }
          }
        })
      )
      
      setProvidersWithReviews(providersWithReviewData)
    } catch (error) {
      console.error('Error loading providers review data:', error)
      setProvidersWithReviews(providersList.map(provider => ({
        ...provider,
        rating: provider.rating || 0,
        total_reviews: 0,
        rating_distribution: null
      })))
    }
  }

  // Helper function to get provider image with full URL
  const getProviderImage = (provider) => {
    const baseUrl = getApiBaseUrl()
    
    if (provider.banner) {
      return provider.banner.startsWith('http') ? provider.banner : `${baseUrl}${provider.banner}`
    }
    
    if (provider.logo) {
      return provider.logo.startsWith('http') ? provider.logo : `${baseUrl}${provider.logo}`
    }
    
    return 'src/assets/images/SnB_leaf_icon.png'
  }

  // Use providers with review data for filtering if available, otherwise use original providers
  const dataToFilter = providersWithReviews.length > 0 ? providersWithReviews : providers

  // Extract all unique categories from business_tags
  const allCategories = [
    'All',
    ...new Set(
      dataToFilter
        .filter(provider => provider.business_tags?.length > 0)
        .flatMap(provider => provider.business_tags)
    )
  ].sort()

  // Filter providers based on search and category
  const filteredProviders = dataToFilter.filter((provider) => {
    const matchesSearch = searchQuery === '' ||
      provider.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.business_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.business_tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' ||
      provider.business_tags?.includes(selectedCategory)
    
    return matchesSearch && matchesCategory
  })

  // Loading state
  if (loading && filteredProviders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading food providers...</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Finding the best local options for you</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <CustomerNavBar />
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-red-100 dark:border-red-900/50">
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <X className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">Something went wrong</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We're having trouble loading the food providers. Please try again.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <CustomerNavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            Local Food Providers
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover restaurants and stores committed to reducing food waste in your community
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search providers by name, cuisine, or location..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <select
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl pl-4 pr-10 py-3 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {allCategories.map((category) => (
                    <option key={category} value={category} className="bg-white dark:bg-gray-800">
                      {category === 'All' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-4 py-3 border rounded-xl text-sm font-medium transition-colors ${
                  showFilters || selectedCategory !== 'All' || searchQuery
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {allCategories.filter(cat => cat !== 'All').map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Show loading indicator while providers are being updated */}
        {loading && filteredProviders.length > 0 && (
          <div className="mb-6 flex items-center justify-center">
            <div className="inline-flex items-center px-4 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Updating providers...
            </div>
          </div>
        )}

        {/* Providers Grid */}
        {filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider) => (
              <Link
                to={`/provider/${provider.id}`}
                key={provider.id}
                className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-emerald-100 dark:hover:border-emerald-900/30 flex flex-col h-full"
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={getProviderImage(provider)}
                    alt={provider.business_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.target.src = 'src/assets/images/SnB_leaf_icon.png'
                      e.target.className = 'w-full h-full object-contain p-8 bg-gray-50 dark:bg-gray-700/30'
                    }}
                  />
                </div>
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {provider.business_name}
                    </h3>
                    <div className="flex items-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-current mr-1" />
                      <span>{provider.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {provider.business_address && (
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-2">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">{provider.business_address}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No providers found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery || selectedCategory !== 'All' 
                ? 'Try adjusting your search or filter criteria.'
                : 'There are currently no food providers available.'}
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodProvidersPage