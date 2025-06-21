import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

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
    return {
        id: backendListing.id,
        name: backendListing.name,
        title: backendListing.name, // Map name to title for compatibility
        description: backendListing.description,
        image: backendListing.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', // fallback image
        imageUrl: backendListing.imageUrl,
        provider: backendListing.provider?.business_name || 'Unknown Provider',
        provider_name: backendListing.provider?.business_name,
        provider_address: backendListing.provider?.business_address,
        provider_logo: backendListing.provider?.logo,
        originalPrice: parseFloat(backendListing.original_price || 0),
        discountPrice: parseFloat(backendListing.discounted_price || 0),
        discountedPrice: parseFloat(backendListing.discounted_price || 0),
        savings: backendListing.savings || 0,
        discountPercentage: backendListing.discount_percentage || 0,
        quantity: backendListing.quantity || 0,
        quantityAvailable: backendListing.quantity_available || 0,
        expiryDate: backendListing.expiry_date,
        expirationTime: formatExpirationTime(backendListing.expiry_date),
        pickupWindow: backendListing.pickup_window,
        allergens: backendListing.allergens || [],
        dietaryInfo: backendListing.dietary_info || [],
        foodType: backendListing.food_type,
        status: backendListing.status,
        isAvailable: backendListing.is_available,
        type: backendListing.discounted_price > 0 ? 'Discount' : 'Donation',
        distance: '0.5 km', // This would come from geolocation calculation
        createdAt: backendListing.created_at,
        updatedAt: backendListing.updated_at
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
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return 'customer';
        
        const user = JSON.parse(storedUser);
        
        // Check if user has organisation_name (NGO)
        if (user.organisation_name || user.representative_name) {
            return 'ngo';
        }
        
        // Check if user has business_name (Provider)
        if (user.business_name) {
            return 'provider';
        }
        
        // Default to customer
        return 'customer';
    } catch (error) {
        console.error('Error determining user type:', error);
        return 'customer';
    }
};



const buildQueryParams = (filters = {}, searchQuery = '', sortBy = '') => {
    const params = new URLSearchParams();
    
    if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
    }
    
    if (sortBy) {
        const sortMapping = {
            'price_asc': 'discounted_price',
            'price_desc': '-discounted_price',
            'expiry_asc': 'expiry_date',
            'distance': 'created_at' // Fallback to created_at since distance sorting is not implemented yet
        };
        params.append('sort', sortMapping[sortBy] || sortBy);
    }
    
    // Filter by price range
    if (filters.priceRange && filters.priceRange[1] < 20) {
        params.append('priceMin', filters.priceRange[0]);
        params.append('priceMax', filters.priceRange[1]);
    }
    
    // Filter by type
    if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
    }
    
    // Filter by provider
    if (filters.provider && filters.provider !== 'all') {
        params.append('store', filters.provider);
    }
    
    // Filter by expiration
    if (filters.expiration && filters.expiration !== 'all') {
        params.append('expiry_filter', filters.expiration);
    }
    
    return params.toString();
};


const foodListingsAPI = {
    // Get all food listings for browsing (customer view)
    async getFoodListings(filters = {}, searchQuery = '', sortBy = '') {
        try {
            const queryParams = buildQueryParams(filters, searchQuery, sortBy);
            const url = `/api/food-listings/${queryParams ? `?${queryParams}` : ''}`;
            
            const response = await apiClient.get(url);
            
            // Transform the data to match your frontend format
            const transformedListings = response.data.listings?.map(transformListingData) || [];
            
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
                error: error.response?.data?.message || 'Failed to fetch food listings'
            };
        }
    },

     async getFoodListingDetails(listingId) {
        try {
            const response = await apiClient.get(`/api/food-listings/${listingId}/`);
            
            return {
                success: true,
                data: transformListingData(response.data)
            };
        } catch (error) {
            console.error('Error fetching food listing details:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch listing details'
            };
        }
    },

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

    async createFoodListing(listingData) {
        try {
            const response = await apiClient.post('/api/provider/listings/create/', listingData);
            
            return {
                success: true,
                data: transformListingData(response.data)
            };
        } catch (error) {
            console.error('Error creating food listing:', error);
            return {
                success: false,
                error: error.response?.data || 'Failed to create listing'
            };
        }
    },

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

    async createListing(listingData) {
        try {
            // If listingData is FormData, don't set Content-Type header
            const config = listingData instanceof FormData ? {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            } : {};

            const response = await apiClient.post('/api/provider/listings/create/', listingData, config);
            return {
                success: true,
                data: transformListingData(response.data)
            };
        } catch (error) {
            console.error('Error creating food listing:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create listing'
            };
        }
    },

    async deleteListing(id) {
        try {
            const response = await apiClient.delete(`/food-listings/${id}/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete listing'
            };
        }
    },
};

export default foodListingsAPI;
