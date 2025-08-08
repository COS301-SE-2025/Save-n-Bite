import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchIcon, StarIcon, MapPinIcon } from 'lucide-react'
import CustomerNavBar from '../../components/auth/CustomerNavBar'

// Mock data for food providers
const foodProviders = [
  {
    id: 1,
    name: 'Sweet Bakery',
    image:
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description: 'Artisanal bakery specializing in fresh pastries and bread',
    address: '123 Main St, Eco City',
    itemCount: 12,
    rating: 4.8,
    followers: 324,
    categories: ['Bakery', 'Pastries', 'Bread'],
  },
  {
    id: 2,
    name: 'Green Cafe',
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description: 'Vegetarian and vegan cafe with daily fresh options',
    address: '456 Elm St, Eco City',
    itemCount: 8,
    rating: 4.6,
    followers: 256,
    categories: ['Vegetarian', 'Vegan', 'Cafe'],
  },
  {
    id: 3,
    name: 'Artisan Bakery',
    image:
      'https://images.unsplash.com/photo-1568254183919-78a4f43a2877?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description:
      'Traditional bakery with a focus on sourdough and specialty breads',
    address: '789 Oak St, Eco City',
    itemCount: 15,
    rating: 4.9,
    followers: 412,
    categories: ['Bakery', 'Bread', 'Artisanal'],
  },
  {
    id: 4,
    name: 'Local Grocery',
    image:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description: 'Neighborhood grocery with fresh produce and prepared foods',
    address: '321 Pine St, Eco City',
    itemCount: 30,
    rating: 4.5,
    followers: 189,
    categories: ['Grocery', 'Produce', 'Prepared Foods'],
  },
  {
    id: 5,
    name: 'Italian Corner',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description: 'Authentic Italian deli and prepared meals',
    address: '654 Maple St, Eco City',
    itemCount: 18,
    rating: 4.7,
    followers: 276,
    categories: ['Italian', 'Deli', 'Prepared Meals'],
  },
  {
    id: 6,
    name: 'Lunch Spot',
    image:
      'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description: 'Quick and healthy lunch options for busy professionals',
    address: '987 Cedar St, Eco City',
    itemCount: 10,
    rating: 4.4,
    followers: 156,
    categories: ['Lunch', 'Quick Service', 'Healthy'],
  },
  {
    id: 7,
    name: 'Fresh Farm',
    image:
      'https://images.unsplash.com/photo-1585059895524-72359e06133a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description: 'Farm-to-table produce and prepared foods',
    address: '246 Birch St, Eco City',
    itemCount: 22,
    rating: 4.9,
    followers: 345,
    categories: ['Farm-to-Table', 'Produce', 'Organic'],
  },
  {
    id: 8,
    name: 'Sushi Express',
    image:
      'https://images.unsplash.com/photo-1617196034183-421b4917c92d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    description: 'Fresh sushi and Japanese cuisine',
    address: '135 Willow St, Eco City',
    itemCount: 14,
    rating: 4.6,
    followers: 210,
    categories: ['Sushi', 'Japanese', 'Asian'],
  },
]
const FoodProvidersPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  // Extract all unique categories
  const allCategories = [
    'All',
    ...new Set(foodProviders.flatMap((provider) => provider.categories)),
  ]
  // Filter providers based on search and category
  const filteredProviders = foodProviders.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'All' ||
      provider.categories.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
      <CustomerNavBar />
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Food Providers
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
            </div>
            <div className="md:w-64">
              <select
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
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
              to={`/providers/${provider.id}`}
              key={provider.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-48">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                  {provider.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                  {provider.description}
                </p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center text-amber-500">
                    <StarIcon size={16} className="fill-current" />
                    <span className="ml-1 text-sm">{provider.rating}</span>
                  </div>
                  <span className="mx-2 text-gray-300 dark:text-gray-700">•</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {provider.categories.slice(0, 3).map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  {provider.itemCount} items available
                </div>
              </div>
            </Link>
          ))}
        </div>
        {/* Empty state */}
        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
              No providers found
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
export default FoodProvidersPage
