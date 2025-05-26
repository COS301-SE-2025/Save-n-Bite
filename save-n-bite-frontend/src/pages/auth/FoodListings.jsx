import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SearchBar from '../../components/auth/SearchBar';
import FilterSidebar from '../../components/auth/FilterSidebar';
import FoodListingsGrid from '../../components/auth/FoodListingsGrid';
import FoodProviderCarousel from '../../components/auth/FoodProviderCarousel';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import Sort from '../../components/auth/Sort';


// Mock data for food listings
const foodListings = [
  {
    id: 1,
    title: 'Assorted Pastries Box',
    image: 'https://images.unsplash.com/photo-1609950547346-a4f431435b2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    provider: 'Sweet Bakery',
    originalPrice: 18.99,
    discountPrice: 7.99,
    expirationTime: 'Today, 8 PM',
    type: 'Discount',
    distance: '0.8 km'
  },
  {
    id: 2,
    title: 'Vegetarian Lunch Box',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    provider: 'Green Cafe',
    originalPrice: 12.5,
    discountPrice: 5.5,
    expirationTime: 'Today, 6 PM',
    type: 'Discount',
    distance: '1.2 km'
  },
  {
    id: 3,
    title: 'Fresh Bread Assortment',
    image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    provider: 'Artisan Bakery',
    originalPrice: 15.0,
    discountPrice: 6.0,
    expirationTime: 'Tomorrow, 10 AM',
    type: 'Discount',
    distance: '0.5 km'
  },
  {
    id: 4,
    title: 'Surplus Produce Box',
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    provider: 'Local Grocery',
    originalPrice: 20.0,
    discountPrice: 8.5,
    expirationTime: 'Today, 9 PM',
    type: 'Discount',
    distance: '1.5 km'
  },
  {
    id: 5,
    title: 'Pasta Meal Kit',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    provider: 'Italian Corner',
    originalPrice: 16.99,
    discountPrice: 0,
    expirationTime: 'Tomorrow, 2 PM',
    type: 'Donation',
    distance: '2.1 km'
  },
  {
    id: 6,
    title: 'Sandwich Platter',
    image: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    provider: 'Lunch Spot',
    originalPrice: 24.99,
    discountPrice: 9.99,
    expirationTime: 'Today, 7 PM',
    type: 'Discount',
    distance: '0.7 km'
  }
];

const FoodListings = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: [0, 20],
    expiration: 'all',
    type: 'all',
    provider : 'all'
  });
  const uniqueProviders = Array.from(
  new Set(foodListings.map(item => item.provider_name || 'Unknown'))
);
const [selectedSort, setSelectedSort] = useState('');


  // Filter listings based on search and filters
  const filteredListings = foodListings.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = item.type === 'Donation' || item.discountPrice <= filters.priceRange[1];
    const matchesType = filters.type === 'all' || 
                       (filters.type === 'discount' && item.type === 'Discount') ||
                       (filters.type === 'donation' && item.type === 'Donation');
    const matchesProvider = filters.provider === 'all' || item.provider_name === filters.provider;
    
    return matchesSearch && matchesPrice && matchesType && matchesProvider;
  });

  return (
    
    <div className="bg-gray-50 min-h-screen w-full">
      <CustomerNavBar/>
      <br/>
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      <br/>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <FilterSidebar 
            showFilters={showFilters}
            filters={filters}
            setFilters={setFilters}
            providerOptions={uniqueProviders}
          />
          <Sort selectedSort={selectedSort} setSelectedSort={setSelectedSort} />
          
          <div className="flex-grow">
            <FoodListingsGrid listings={filteredListings} />
          </div>
        </div>
        
        {/* Food Provider Carousel Section */}
        <div className="mt-12">
          <FoodProviderCarousel />
        </div>
      </div>
    </div>
  );
};

export default FoodListings;