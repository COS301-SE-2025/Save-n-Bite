import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    priceRange: [0, 1000],
    expiration: 'all',
    type: 'all',
    provider: 'all'
  });
  const [selectedSort, setSelectedSort] = useState('');

  // State for API data
  const [allFoodListings, setAllFoodListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uniqueProviders, setUniqueProviders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [userType, setUserType] = useState('customer');

  // Helper function to determine what listings a user can see
  const filterListingsByUserType = (listings) => {
    if (!Array.isArray(listings)) return [];

    const currentUserType = foodListingsAPI.getUserType();

    switch (currentUserType) {
      case 'customer':
        // Customers only see discounted items (items with a price > 0)
        return listings.filter(listing => {
          const price = listing.discountedPrice || listing.discountPrice || 0;
          return price > 0 && listing.type?.toLowerCase() === 'discount';
        });
      case 'ngo':
        // NGOs see both discounted items and donations
        return listings.filter(listing => {
          const type = listing.type?.toLowerCase();
          return type === 'discount' || type === 'donation';
        });
      default:
        // Default to showing all listings
        return listings;
    }
  };

  // Apply filters to the listings
  const applyFilters = (listings) => {
    let filtered = [...listings];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.provider_name && item.provider_name.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(item => {
        const itemType = item.type?.toLowerCase();
        const filterType = filters.type.toLowerCase();
        return itemType === filterType;
      });
    }

    // Apply price range filter
    filtered = filtered.filter(item => {
      const itemPrice = item.discountedPrice || item.discountPrice || 0;
      return itemPrice >= filters.priceRange[0] && itemPrice <= filters.priceRange[1];
    });

    // Apply provider filter
    if (filters.provider !== 'all') {
      filtered = filtered.filter(item =>
        item.provider_name === filters.provider ||
        item.provider?.business_name === filters.provider
      );
    }

    // Apply expiration filter
    if (filters.expiration !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(item => {
        if (!item.expiryDate) return filters.expiration === 'later';

        const expiryDate = new Date(item.expiryDate);

        switch (filters.expiration) {
          case 'today':
            return expiryDate >= today && expiryDate < tomorrow;
          case 'tomorrow':
            return expiryDate >= tomorrow && expiryDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          case 'this_week':
            return expiryDate >= today && expiryDate <= nextWeek;
          case 'later':
            return expiryDate > nextWeek;
          default:
            return true;
        }
      });
    }

    // Apply sorting - Update this section
    if (selectedSort) {
      filtered.sort((a, b) => {
        switch (selectedSort) {
          case 'price-low':
            const priceA = parseFloat(a.discounted_price) || parseFloat(a.discountedPrice) || 0;
            const priceB = parseFloat(b.discounted_price) || parseFloat(b.discountedPrice) || 0;
            return priceA - priceB;

          case 'price-high':
            const priceHighA = parseFloat(a.discounted_price) || parseFloat(a.discountedPrice) || 0;
            const priceHighB = parseFloat(b.discounted_price) || parseFloat(b.discountedPrice) || 0;
            return priceHighB - priceHighA;

          case 'name':
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);

          case 'expiry':
            const dateA = new Date(a.expiry_date || a.expiryDate || 0);
            const dateB = new Date(b.expiry_date || b.expiryDate || 0);
            return dateA - dateB;

          case 'newest':
            const createdAtA = new Date(a.created_at || a.createdAt || 0);
            const createdAtB = new Date(b.created_at || b.createdAt || 0);
            return createdAtB - createdAtA;

          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  // Get available type filter options based on user type
  const getAvailableTypeFilters = () => {
    const currentUserType = foodListingsAPI.getUserType();

    const options = [
      { value: 'all', label: 'All Items' }
    ];

    // Add discount option for all users
    if (allFoodListings.some(item => item.type?.toLowerCase() === 'discount')) {
      options.push({ value: 'discount', label: 'Discounted Items' });
    }

    // Add donation option only for NGOs
    if (currentUserType === 'ngo' && allFoodListings.some(item => item.type?.toLowerCase() === 'donation')) {
      options.push({ value: 'donation', label: 'Donations' });
    }

    return options;
  };

  // Get unique providers for filter dropdown
  const getUniqueProviders = (listings) => {
    const providerSet = new Set();
    listings.forEach(listing => {
      const providerName = listing.provider_name || listing.provider?.business_name;
      if (providerName && providerName !== 'Unknown Provider') {
        providerSet.add(providerName);
      }
    });

    return Array.from(providerSet).map(name => ({
      value: name,
      label: name
    }));
  };

  // Fetch food listings from API
  const fetchFoodListings = async () => {
    setLoading(true);
    try {
      const response = await foodListingsAPI.getFoodListings();

      if (response.success) {
        console.log('Raw API data:', response.data);

        const allListings = response.data.listings || [];
        setAllFoodListings(allListings);

        // Filter by user type first
        const currentUserType = foodListingsAPI.getUserType();
        setUserType(currentUserType);
        const userTypeFiltered = filterListingsByUserType(allListings);

        // Then apply other filters
        const finalFiltered = applyFilters(userTypeFiltered);

        setFilteredListings(finalFiltered);
        setTotalCount(finalFiltered.length);

        // Update unique providers
        setUniqueProviders(getUniqueProviders(allListings));

        setError(null);
      } else {
        setError(response.error || 'Failed to fetch listings');
      }
    } catch (error) {
      console.error('Fetch error details:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  useEffect(() => {
    if (allFoodListings.length > 0) {
      const currentUserType = foodListingsAPI.getUserType();
      setUserType(currentUserType);

      const userTypeFiltered = filterListingsByUserType(allFoodListings);
      const finalFiltered = applyFilters(userTypeFiltered);

      setFilteredListings(finalFiltered);
      setTotalCount(finalFiltered.length);
    }
  }, [filters, searchQuery, selectedSort, allFoodListings]);

  // Initial load
  useEffect(() => {
    fetchFoodListings();
  }, []);

  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 1000],
      expiration: 'all',
      type: 'all',
      provider: 'all'
    });
    setSearchQuery('');
    setSelectedSort('');
  };

  // Loading state
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
      <CustomerNavBar />
      <br />
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />

      <br />

      <div className="container-responsive max-w-6xl mx-auto p-4 md:p-6">
        {/* Error message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-3 py-3 sm:px-4 sm:py-3 rounded-md transition-colors duration-300">
            <p className="font-medium text-sm sm:text-base">Error loading listings</p>
            <p className="text-xs sm:text-sm mt-1">{error}</p>
            <button
              onClick={fetchFoodListings}
              className="mt-2 text-xs sm:text-sm underline hover:no-underline touch-target"
            >
              Try again
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <FilterSidebar
            showFilters={showFilters}
            filters={filters}
            setFilters={setFilters}
            providerOptions={uniqueProviders}
            typeOptions={getAvailableTypeFilters()}
            onResetFilters={handleResetFilters}
             userType={userType}  
          />

          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">

                {loading ? 'Loading...' : `${totalCount} listings found`}
                {userType === 'customer' && (
                  <span className="text-gray-500 ml-2">(Discounted items only)</span>
                )}
                {userType === 'ngo' && (
                  <span className="text-gray-500 ml-2">(Discounted items & donations)</span>
                )}
              </div>
              <Sort
                selectedSort={selectedSort}
                setSelectedSort={setSelectedSort}
              />
            </div>

            {loading && filteredListings.length > 0 && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-200 rounded-md text-sm transition-colors duration-300">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-emerald-600 mr-2"></div>

                  Updating listings...
                </div>
              </div>
            )}

            <FoodListingsGrid listings={filteredListings} />

            {/* Empty state */}
            {!loading && filteredListings.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <p className="text-xl text-gray-600 mb-4">No listings found</p>
                <p className="text-gray-500 mb-4">
                  {allFoodListings.length === 0
                    ? 'No food listings available at the moment.'
                    : 'Try adjusting your search or filters to see more results.'
                  }
                </p>
                {filteredListings.length === 0 && allFoodListings.length > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
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