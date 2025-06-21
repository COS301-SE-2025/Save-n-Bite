import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/auth/SearchBar';
import FilterSidebar from '../../components/auth/FilterSidebar';
import FoodListingsGrid from '../../components/auth/FoodListingsGrid';
import FoodProviderCarousel from '../../components/auth/FoodProviderCarousel';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import Sort from '../../components/auth/Sort';
import foodListingsAPI from '../../services/foodListingsAPI';

const FoodListings = () => {
  const navigate = useNavigate();
  const { getUserType, isNGO, isCustomer } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: [0, 20],
    expiration: 'all',
    type: 'all',
    provider: 'all'
  });
  const [selectedSort, setSelectedSort] = useState('');
  
  // State for API data
  const [foodListings, setFoodListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uniqueProviders, setUniqueProviders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const userType = getUserType();

  // Fetch food listings with user type consideration
  const fetchFoodListings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await foodListingsAPI.getFoodListings(filters, searchQuery, selectedSort, userType);
      
      if (response.success) {
        setFoodListings(response.data.listings);
        setTotalCount(response.data.count);
      } else {
        setError(response.error);
        setFoodListings([]);
      }
    } catch (err) {
      
      setError('An unexpected error occurred while fetching listings');
    
      if (foodListings.length === 0) {
        setFoodListings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  
  const fetchUniqueProviders = async () => {
    try {
      const response = await foodListingsAPI.getUniqueProviders();
      if (response.success) {
        setUniqueProviders(response.data);
      }
    } catch (err) {
    
      console.error('Error fetching providers:', err);
    }
  };


  useEffect(() => {
    fetchFoodListings();
    fetchUniqueProviders();
  }, [userType]); 

  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFoodListings();
    }, 300); 

    return () => clearTimeout(debounceTimer);
  }, [filters, searchQuery, selectedSort]);

 
  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 20],
      expiration: 'all',
      type: 'all',
      provider: 'all'
    });
    setSearchQuery('');
    setSelectedSort('');
  };

  // Get available filter options based on user type
  const getAvailableTypeFilters = () => {
    if (isCustomer()) {
      return [
        { value: 'all', label: 'All Items' },
        { value: 'discount', label: 'Discounted' }
      ];
    } else if (isNGO()) {
      return [
        { value: 'all', label: 'All Items' },
        { value: 'discount', label: 'Discounted' },
        { value: 'donation', label: 'Donations' }
      ];
    }
    return [
      { value: 'all', label: 'All Items' },
      { value: 'discount', label: 'Discounted' },
      { value: 'donation', label: 'Donations' }
    ];
  };

  if (loading && foodListings.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading food listings...</p>
          </div>
        </div>
      </div>
    );
  }

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
      
      <br />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* User type info banner */}
        {userType && (
          <div className="mb-4 p-3 rounded-lg border">
            {isCustomer() && (
              <div className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <p className="text-sm font-medium">
                  🛍️ Customer View - Showing discounted items available for purchase
                </p>
              </div>
            )}
            {isNGO() && (
              <div className="bg-blue-50 border-blue-200 text-blue-800">
                <p className="text-sm font-medium">
                  🏢 NGO View - Showing both discounted items for purchase and donation requests
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading listings</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchFoodListings}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          <FilterSidebar 
            showFilters={showFilters}
            filters={filters}
            setFilters={setFilters}
            providerOptions={uniqueProviders}
            typeOptions={getAvailableTypeFilters()}
            onResetFilters={handleResetFilters}
          />
          
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${totalCount} listings found`}
              </div>
              <Sort 
                selectedSort={selectedSort} 
                setSelectedSort={setSelectedSort} 
              />
            </div>
            
            {loading && foodListings.length > 0 && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  Updating listings...
                </div>
              </div>
            )}
            
            <FoodListingsGrid listings={foodListings} />
          </div>
        </div>
        
        {/* Food Provider Carousel Section */}
        {!loading && foodListings.length > 0 && (
          <div className="mt-12">
            <FoodProviderCarousel />
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodListings;