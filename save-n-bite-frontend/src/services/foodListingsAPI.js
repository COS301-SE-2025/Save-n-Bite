import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://savenbiteservice-hzghg8gcgddtcfg7.southafricanorth-01.azurewebsites.net';
const API_BASE_URL = 'http://localhost:8000' ;
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
        image: listing.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', // fallback image
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

// const getUserType = () => {
//     try {
//         const storedUser = localStorage.getItem('user');
//         if (!storedUser) return 'customer';
        
//         const user = JSON.parse(storedUser);
        
//         // Check if user has organisation_name (NGO)
//         if (user.organisation_name || user.representative_name) {
//             return 'ngo';
//         }
        
//         // Check if user has business_name (Provider)
//         if (user.business_name) {
//             return 'provider';
//         }
        
//         // Default to customer
//         return 'customer';
//     } catch (error) {
//         console.error('Error determining user type:', error);
//         return 'customer';
//     }
// };
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

    getUserType: getUserType
};

export { getUserType };
export default foodListingsAPI;