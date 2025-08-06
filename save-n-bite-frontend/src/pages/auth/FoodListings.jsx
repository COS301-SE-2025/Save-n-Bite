import React, { useState, useEffect } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import SearchBar from '../../components/auth/SearchBar';
import FilterSidebar from '../../components/auth/FilterSidebar';
import FoodListingsGrid from '../../components/auth/FoodListingsGrid';
import FoodProviderCarousel from '../../components/auth/FoodProviderCarousel';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
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
  const [allFoodListings, setAllFoodListings] = useState([]); // Store all listings
  const [filteredListings, setFilteredListings] = useState([]); // Store filtered listings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uniqueProviders, setUniqueProviders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [userType, setUserType] = useState('customer'); // Track user type locally

  // Helper functions to check user type
  const isCustomer = () => userType === 'customer';
  const isNGO = () => userType === 'ngo';

const filterListingsByUserType = (listings) => {
  if (!Array.isArray(listings)) return [];
  
  const currentUserType = foodListingsAPI.getUserType();
  
  switch(currentUserType) {
    case 'customer':
      return listings.filter(listing => 
        listing?.type?.toLowerCase() === 'discount' // Case-insensitive check
      );
    case 'ngo':
      return listings.filter(listing => {
        const type = listing?.type?.toLowerCase();
        return type === 'discount' || type === 'donation';
      });
    default:
      return listings;
  }
};

  // Fetch food listings
 const fetchFoodListings = async () => {
  setLoading(true);
  try {
    const response = await foodListingsAPI.getFoodListings(filters, searchQuery, selectedSort);
    
    if (response.success) {
      console.log('Raw API data:', response.data); // Debug log
      
      const allListings = response.data.listings || [];
      setAllFoodListings(allListings);
      
      // Immediately filter after setting all listings
      const currentUserType = foodListingsAPI.getUserType();
      setUserType(currentUserType);
      const filtered = filterListingsByUserType(allListings);
      
      setFilteredListings(filtered);
      setTotalCount(filtered.length);
    }
  } catch (error) {
    console.error('Fetch error details:', error);
    setError(error.message);
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
  }, []); 

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFoodListings();
    }, 300); 

    return () => clearTimeout(debounceTimer);
  }, [filters, searchQuery, selectedSort]);

  useEffect(() => {
  console.log('All listings:', allFoodListings);
  console.log('Filtered listings:', filteredListings);
  console.log('User type:', userType);
}, [allFoodListings, filteredListings, userType]);

 useEffect(() => {
  if (allFoodListings.length > 0) {
    // Always get fresh user type in case it changed
    const currentUserType = foodListingsAPI.getUserType();
    setUserType(currentUserType);
    
    const userFilteredListings = filterListingsByUserType(allFoodListings);
    setFilteredListings(userFilteredListings);
    setTotalCount(userFilteredListings.length);
  }
}, [allFoodListings]); // Removed userType dependency - we get it fresh each time

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

const getAvailableTypeFilters = () => {
  const currentUserType = foodListingsAPI.getUserType();
  
  const options = [
    { value: 'all', label: 'All Items' },
    { value: 'Discount', label: 'Discounted' } 
  ];
  
  if (currentUserType === 'ngo') {
    options.push({ value: 'Donation', label: 'Donations' });
  }
  
  return options;
};


  if (loading && filteredListings.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
        <CustomerNavBar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-200">Loading food listings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
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
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded-md transition-colors duration-300">
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
              <div className="text-sm text-gray-600 dark:text-gray-200">
                {loading ? 'Loading...' : `${totalCount} listings found`}
              </div>
              <Sort 
                selectedSort={selectedSort} 
                setSelectedSort={setSelectedSort} 
              />
            </div>
            
            {loading && filteredListings.length > 0 && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-200 rounded-md transition-colors duration-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
                  Updating listings...
                </div>
              </div>
            )}
            
            <FoodListingsGrid listings={filteredListings} />
          </div>
        </div>
        
        {/* Food Provider Carousel Section */}
        {!loading && filteredListings.length > 0 && (
          <div className="mt-12">
            <FoodProviderCarousel />
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            to="/providers"
            className="inline-flex items-center px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
          >
            View All Food Providers
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FoodListings;