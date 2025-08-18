import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://savenbiteservice-hzghg8gcgddtcfg7.southafricanorth-01.azurewebsites.net';
// const API_BASE_URL = 'http://localhost:8000' ;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


// Add request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Only retry if it's a 401 error and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    // If no refresh token, just return the error
                    return Promise.reject(error);
                }

                const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                    refresh: refreshToken
                });
                
                const { access } = response.data;
                localStorage.setItem('authToken', access);
                
                // Update the authorization header
                originalRequest.headers.Authorization = `Bearer ${access}`;
                
                // Retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Only redirect to login if it's a token error
                if (refreshError.response?.status === 401) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    // Use a more graceful redirect
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                }
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);


const transformListingData = (backendListing) => {
    // Handle both response structures:
    // 1. Direct listing data: { id, name, description, ... }
    // 2. Wrapped response: { message, listing: { id, name, ... } }
    
    const listing = backendListing.listing || backendListing;
    
    return {
        id: listing.id,
        name: listing.name,
        title: listing.name, // Map name to title for compatibility
        description: listing.description,
        image: listing.imageUrl && listing.imageUrl.trim() !== '' 
            ? listing.imageUrl 
            : 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        imageUrl: listing.imageUrl,
        provider: {
            id: listing.provider?.id,
            business_name: listing.provider?.business_name || 'Unknown Provider',
        },
        provider_name: listing.provider?.business_name,
        provider_address: listing.provider?.business_address,
        provider_logo: listing.provider?.logo,
        originalPrice: parseFloat(listing.original_price || listing.price || 0),
        discountPrice: parseFloat(listing.discounted_price || listing.price || 0),
        discountedPrice: parseFloat(listing.discounted_price || listing.price || 0),
        savings: listing.savings || 0,
        discountPercentage: listing.discount_percentage || 0,
        quantity: listing.quantity || 0,
        quantityAvailable: listing.quantity_available || listing.quantity || 0,
        expiryDate: listing.expiry_date,
        expirationTime: formatExpirationTime(listing.expiry_date),
        pickupWindow: listing.pickup_window,
        allergens: listing.allergens || [],
        dietaryInfo: listing.dietary_info || [],
        foodType: listing.food_type,
        status: listing.status,
        isAvailable: listing.is_available,
        type: (listing.discounted_price || listing.price) > 0 ? 'Discount' : 'Donation',
        distance: '0.5 km', // This would come from geolocation calculation
        createdAt: listing.created_at || listing.createdAt,
        updatedAt: listing.updated_at || listing.updatedAt
    };
};


const formatExpirationTime = (expiryDate) => {
    if (!expiryDate) return 'No expiry date';
    
    // Parse the date and convert it to South Africa time (UTC+2)
    const expiryUTC = new Date(expiryDate);
    const expiry = new Date(expiryUTC.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

    const now = new Date();
    const nowSA = new Date(now.getTime() + 2 * 60 * 60 * 1000); // also adjust current time
    const today = new Date(nowSA.getFullYear(), nowSA.getMonth(), nowSA.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (expiry >= today && expiry < tomorrow) {
        return `Today, ${expiry.toLocaleTimeString('en-ZA', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        })}`;
    } else if (expiry >= tomorrow && expiry < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
        return `Tomorrow, ${expiry.toLocaleTimeString('en-ZA', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        })}`;
    } else {
        return expiry.toLocaleDateString('en-ZA', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
    }
};

const getUserType = () => {
    try {
        // Check multiple possible storage keys
        const possibleKeys = ['user', 'userData', 'currentUser', 'authUser', 'profile'];
        
        for (const key of possibleKeys) {
            const item = localStorage.getItem(key);
            if (item) {
                try {
                    const user = JSON.parse(item);
                    
                    // Check for explicit user_type field
                    if (user.user_type) {
                        return user.user_type;
                    }
                    
                    // Fallback: determine from user properties
                    if (user.organisation_name || user.representative_name) {
                        return 'ngo';
                    }
                    if (user.business_name) {
                        return 'provider';
                    }
                } catch (parseError) {
                    console.warn(`Failed to parse ${key} from localStorage:`, parseError);
                }
            }
        }
        
        // Default fallback
        return 'customer';
    } catch (error) {
        console.error('Error determining user type:', error);
        return 'customer';
    }
};

const buildQueryParams = (filters = {}, searchQuery = '', sortBy = '') => {
    const params = new URLSearchParams();
    
    // Search query
    if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
    }
    
    // Sorting
    if (sortBy) {
        const sortMapping = {
            'price-low': 'discounted_price',
            'price-high': '-discounted_price',
            'expiry': 'expiry_date',
            'name': 'name',
            'newest': '-created_at'
        };
        params.append('ordering', sortMapping[sortBy] || sortBy);
    }
    
    // Price range filter - only add if not at maximum
    if (filters.priceRange && filters.priceRange[1] < 1000) {
        params.append('min_price', filters.priceRange[0]);
        params.append('max_price', filters.priceRange[1]);
    }
    
    // Type filter
    if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
    }
    
    // Provider filter
    if (filters.provider && filters.provider !== 'all') {
        params.append('provider', filters.provider);
    }
    
    // Expiration filter
    if (filters.expiration && filters.expiration !== 'all') {
        params.append('expiration', filters.expiration);
    }
    
    return params.toString();
};

const foodListingsAPI = {
    // Get all food listings for browsing (customer view)
    async getFoodListings(filters = {}, searchQuery = '', sortBy = '') {
        try {
            const queryParams = buildQueryParams(filters, searchQuery, sortBy);
            const url = `/api/food-listings/${queryParams ? `?${queryParams}` : ''}`;
            
            console.log('API Request URL:', url); // Debug log
            
            const response = await apiClient.get(url);
            
            // Transform the data to match your frontend format
            const transformedListings = response.data.listings?.map(transformListingData) || [];
            
            console.log('Transformed listings:', transformedListings); // Debug log
            
            return {
                success: true,
                data: {
                    listings: transformedListings,
                    count: response.data.pagination?.totalItems || transformedListings.length,
                    next: response.data.pagination?.hasNext || false,
                    previous: response.data.pagination?.hasPrev || false,
                    filters: response.data.filters || {}
                }
            };
        } catch (error) {
            console.error('Error fetching food listings:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to fetch food listings'
            };
        }
    },

    // Get food listing details by ID
    async getFoodListingDetails(listingId) {
        try {
            const response = await apiClient.get(`/api/food-listings/${listingId}/`);
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching food listing details:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch listing details'
            };
        }
    },

    // Get provider's own listings
    async getProviderListings() {
        try {
            const response = await apiClient.get('/api/provider/listings/');
            console.log('Provider listings response:', response.data); // Debug log
            
            // Handle different response structures
            let listings = [];
            if (response.data.listings) {
                listings = response.data.listings;
            } else if (Array.isArray(response.data)) {
                listings = response.data;
            } else if (response.data.results) {
                listings = response.data.results;
            }
            
            return {
                success: true,
                data: listings.map(transformListingData)
            };
        } catch (error) {
            console.error('Error fetching provider listings:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch listings'
            };
        }
    },

    // Create new listing (provider functionality)
    async createListing(listingData) {
        try {
            // If listingData is FormData, don't set Content-Type header
            const config = listingData instanceof FormData ? {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            } : {};

            const response = await apiClient.post('/api/provider/listings/create/', listingData, config);
            
            console.log('=== RAW BACKEND RESPONSE ===');
            console.log('Raw response.data:', response.data);
            console.log('Raw response.data.listing:', response.data.listing);
            
            // Don't transform the data here - return the raw backend response
            // so we can access response.data.listing.id in the frontend
            return {
                success: true,
                data: response.data, // Return the raw backend response structure
            };
        } catch (error) {
            console.error('Error creating food listing:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create listing'
            };
        }
    },

    // Update existing listing
    async updateFoodListing(listingId, listingData) {
        try {
            const response = await apiClient.put(`/food-listings/provider/listings/${listingId}/`, listingData);
            
            return {
                success: true,
                data: transformListingData(response.data)
            };
        } catch (error) {
            console.error('Error updating food listing:', error);
            return {
                success: false,
                error: error.response?.data || 'Failed to update listing'
            };
        }
    },

    // Delete food listing
    async deleteFoodListing(listingId) {
        try {
            await apiClient.delete(`/food-listings/provider/listings/${listingId}/`);
            
            return {
                success: true,
                message: 'Listing deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting food listing:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete listing'
            };
        }
    },

    // Get unique providers for filtering
    async getUniqueProviders() {
        try {
            const response = await this.getFoodListings();
            if (response.success) {
                const providers = [...new Set(response.data.listings.map(listing => listing.provider_name || listing.provider))];
                return {
                    success: true,
                    data: providers.filter(provider => provider && provider !== 'Unknown Provider')
                };
            }
            return { success: false, error: 'Failed to fetch providers' };
        } catch (error) {
            console.error('Error fetching unique providers:', error);
            return {
                success: false,
                error: 'Failed to fetch providers'
            };
        }
    },

    // Get food categories/types for filtering
    async getFoodCategories() {
        try {
            const response = await this.getFoodListings();
            if (response.success) {
                const categories = [...new Set(response.data.listings.map(listing => listing.foodType))];
                return {
                    success: true,
                    data: categories.filter(category => category)
                };
            }
            return { success: false, error: 'Failed to fetch categories' };
        } catch (error) {
            console.error('Error fetching food categories:', error);
            return {
                success: false,
                error: 'Failed to fetch categories'
            };
        }
    },
async getListingForEdit(listingId) {
        try {
            const response = await apiClient.get(`/api/food-listings/${listingId}/`);
            
            return {
                success: true,
                data: response.data.listing || response.data
            };
        } catch (error) {
            console.error('Error fetching listing for edit:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch listing details'
            };
        }
    },

    // Update existing listing
    async updateListing(listingId, listingData) {
        try {
            // If listingData is FormData, don't set Content-Type header
            const config = listingData instanceof FormData ? {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            } : {};

            const response = await apiClient.put(`/api/provider/listings/${listingId}/`, listingData, config);
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error updating listing:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.response?.data?.error || 'Failed to update listing'
            };
        }
    },

    // Delete listing - updated to match your endpoint structure
    async deleteListing(listingId) {
        try {
            const response = await apiClient.delete(`/api/provider/listings/${listingId}/delete/`);
            
            return {
                success: true,
                data: response.data,
                message: response.data?.message || 'Listing deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting listing:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.response?.data?.error || 'Failed to delete listing'
            };
        }
    },

    // Alternative delete method (keeping both for compatibility)
    async deleteFoodListing(listingId) {
        return this.deleteListing(listingId);
    },
    // Get user type with debug logging
    getUserType: () => {
        console.log("=== getUserType Debug ===");

        const userTypeFromStorage = getUserType();
        console.log("User type from localStorage:", userTypeFromStorage);

        console.log("========================");
        return userTypeFromStorage;
    }
};

export { getUserType };
export default foodListingsAPI;