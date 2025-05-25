import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../../components/auth/SearchBar';
import FilterSidebar from '../../components/auth/FilterSidebar';
import FoodListingsGrid from '../../components/auth/FoodListingsGrid';
import FoodProviderCarousel from '../../components/auth/FoodProviderCarousel';
import NavBar from '../../components/auth/NavBar';
import Sort from '../../components/auth/Sort';
import foodListingsAPI from '../../services/foodListingsAPI';

const FoodListings = () => {
  const navigate = useNavigate();
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

  // Fetch food listings
  const fetchFoodListings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await foodListingsAPI.getFoodListings(filters, searchQuery, selectedSort);
      
      if (response.success) {
        setFoodListings(response.data.listings);
        setTotalCount(response.data.count);
      } else {
        setError(response.error);
        setFoodListings([]);
      }
    } catch (err) {
      // On any error, just show the error message
      setError('An unexpected error occurred while fetching listings');
      // Don't clear listings if we have them
      if (foodListings.length === 0) {
        setFoodListings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch unique providers for filter
  const fetchUniqueProviders = async () => {
    try {
      const response = await foodListingsAPI.getUniqueProviders();
      if (response.success) {
        setUniqueProviders(response.data);
      }
    } catch (err) {
      // Just log the error, don't navigate
      console.error('Error fetching providers:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchFoodListings();
    fetchUniqueProviders();
  }, []);

  // Fetch data when filters, search, or sort changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFoodListings();
    }, 300); // Debounce search queries

    return () => clearTimeout(debounceTimer);
  }, [filters, searchQuery, selectedSort]);

  // Handle filter reset
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

  if (loading && foodListings.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen w-full">
        <NavBar />
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
      <NavBar />
      <br />
      
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      
      <br />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6">
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