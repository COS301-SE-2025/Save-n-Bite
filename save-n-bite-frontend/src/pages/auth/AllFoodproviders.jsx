import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon, StarIcon, MapPinIcon } from 'lucide-react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
import FoodProvidersAPI, { getApiBaseUrl } from '../../services/FoodProvidersAPI'

const FoodProvidersPage = () => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Load providers from API
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true)
        const result = await FoodProvidersAPI.getAllProviders()
        
        if (result.success && result.data?.providers) {
          setProviders(result.data.providers)
          setError(null)
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

  // Helper function to get provider image with full URL
  const getProviderImage = (provider) => {
    const baseUrl = getApiBaseUrl()
    
    if (provider.banner) {
      if (provider.banner.startsWith('http')) {
        return provider.banner
      }
      return `${baseUrl}${provider.banner}`
    }
    
    if (provider.logo) {
      if (provider.logo.startsWith('http')) {
        return provider.logo
      }
      return `${baseUrl}${provider.logo}`
    }
    
    // Fallback to a generic food provider image
    return 'https://images.unsplash.com/photo-1555507036-ab794f575c5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
  }

  // Extract all unique categories from business_tags
  const allCategories = [
    'All',
    ...new Set(
      providers
        .filter(provider => provider.business_tags && provider.business_tags.length > 0)
        .flatMap(provider => provider.business_tags)
    )
  ]

  // Filter providers based on search and category
  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.business_description && provider.business_description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (provider.business_tags && provider.business_tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    
    const matchesCategory =
      selectedCategory === 'All' ||
      (provider.business_tags && provider.business_tags.includes(selectedCategory))
    
    return matchesSearch && matchesCategory
  })

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Food Providers
            </h1>
            <p className="text-gray-600">
              Loading providers...
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded mb-3 w-1/2"></div>
                  <div className="flex gap-1">
                    <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-300 rounded-full w-12"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded mt-3 w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Food Providers
            </h1>
            <p className="text-red-600">{error}</p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">Unable to load providers</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <CustomerNavBar />
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Food Providers
          </h1>
          <p className="text-gray-600">
            Discover local businesses committed to reducing food waste
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search providers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            <div className="md:w-64">
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <Link
              to={`/provider/${provider.id}`}
              key={provider.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-48">
                <img
                  src={getProviderImage(provider)}
                  alt={provider.business_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1555507036-ab794f575c5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800">
                  {provider.business_name}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {provider.business_description || 'Local food provider committed to reducing waste'}
                </p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center text-amber-500">
                    <StarIcon size={16} className="fill-current" />
                    <span className="ml-1 text-sm">{provider.rating || 4.5}</span>
                  </div>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className="text-sm text-gray-600">
                    {provider.follower_count || 0} followers
                  </span>
                </div>
                
                {provider.business_address && (
                  <div className="flex items-center mt-2 text-gray-600">
                    <MapPinIcon size={14} className="mr-1" />
                    <span className="text-xs truncate">{provider.business_address}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {provider.business_tags && provider.business_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {(!provider.business_tags || provider.business_tags.length === 0) && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Food Provider
                    </span>
                  )}
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {provider.active_listings_count || 0} items available
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filteredProviders.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No providers found</p>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FoodProvidersPage