// src/services/foodAPI.js
import axios from 'axios';

//const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://savenbiteservice-hzghg8gcgddtcfg7.southafricanorth-01.azurewebsites.net';

 const API_BASE_URL = 'http://localhost:8000' ;

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// SIMPLIFIED response interceptor - NO automatic redirects or localStorage clearing
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Just log 401 errors but don't handle them automatically
        if (error.response?.status === 401) {
            console.log('401 response received for:', error.config?.url);
        }
        
        // Let individual API calls handle their own errors
        return Promise.reject(error);
    }
);

const foodAPI = {
 
    getFoodListings: async (filters = {}, searchQuery = '', sortBy = '') => {
        try {
            const params = new URLSearchParams();
            
            // Add search query
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            
            // Add sorting
            if (sortBy) {
                params.append('ordering', sortBy);
            }
            
            // Add filters
            if (filters.priceRange && filters.priceRange[1] > 0) {
                params.append('min_price', filters.priceRange[0]);
                params.append('max_price', filters.priceRange[1]);
            }
            
            if (filters.expiration && filters.expiration !== 'all') {
                params.append('expiry_filter', filters.expiration);
            }
            
            if (filters.type && filters.type !== 'all') {
                params.append('listing_type', filters.type);
            }
            
            if (filters.provider && filters.provider !== 'all') {
                params.append('provider', filters.provider);
            }

            const response = await apiClient.get(`/food-listings/?${params.toString()}`);
            
            return {
                success: true,
                data: {
                    listings: response.data.results || response.data,
                    count: response.data.count || response.data.length
                }
            };
        } catch (error) {
            console.error('Error fetching food listings:', error);
            
            // Return error info but don't handle authentication automatically
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch food listings',
                status: error.response?.status
            };
        }
    },

    getFoodListingDetails: async (listingId) => {
        try {
            const response = await apiClient.get(`/api/food-listings/${listingId}/`);
            
            // Transform the response to match your React component expectations
            const listing = response.data.listing;
            const transformedListing = {
                id: listing.id,
                name: listing.name,
                description: listing.description,
                images: listing.images || [listing.imageUrl],
                provider: {
                    businessName: listing.provider?.business_name || 'Unknown Provider',
                    address: listing.provider?.business_address || 'Address not available'
                },
                type: listing.food_type || 'discount',
                pickupWindow: listing.pickup_window,
                quantity: listing.quantity_available || listing.quantity,
                originalPrice: parseFloat(listing.original_price),
                discountedPrice: parseFloat(listing.discounted_price),
                savings: listing.savings,
                discountPercentage: listing.discount_percentage,
                allergens: listing.allergens,
                dietary_info: listing.dietary_info,
                expiry_date: listing.expiry_date,
                is_available: listing.is_available
            };
            
            return {
                success: true,
                data: transformedListing
            };
        } catch (error) {
            console.error('Error fetching food listing details:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch listing details',
                status: error.response?.status
            };
        }
    },

    getUniqueProviders: async () => {
        try {
            const response = await apiClient.get('/api/food-listings/');
            
            // Extract unique providers from listings
            const listings = response.data.results || response.data;
            const uniqueProviders = [...new Set(
                listings
                    .map(listing => listing.provider?.business_name)
                    .filter(Boolean)
            )];
            
            return {
                success: true,
                data: uniqueProviders
            };
        } catch (error) {
            console.error('Error fetching providers:', error);
            
            return {
                success: false,
                error: 'Failed to fetch providers',
                status: error.response?.status
            };
        }
    },

    getCart: async () => {
        try {
            const response = await apiClient.get('/cart/');
            
            return {
                success: true,
                data: {
                    items: response.data.cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        // Fix the imageUrl handling - check if it's a string before calling replace
                        image: (item.imageUrl && typeof item.imageUrl === 'string') 
                            ? item.imageUrl.replace(/[\[\]']/g, '').split(',')[0] 
                            : null,
                        price: parseFloat(item.pricePerItem),
                        quantity: item.quantity,
                        totalPrice: item.totalPrice,
                        provider: item.provider,
                        pickupWindow: item.pickupWindow,
                        expiryDate: item.expiryDate,
                        // Add the food listing ID that we need for scheduling
                        listingId: item.food_listing.id || item.food_listing_id
                    })),
                    summary: {
                        totalItems: parseInt(response.data.summary.totalItems),
                        subtotal: parseFloat(response.data.summary.subtotal),
                        estimatedSavings: parseFloat(response.data.summary.estimatedSavings),
                        totalAmount: parseFloat(response.data.summary.totalAmount)
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching cart:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch cart',
                status: error.response?.status
            };
        }
    },
  
    addToCart: async (listingId, quantity = 1) => {
        try {
            const response = await apiClient.post('/cart/add/', {
                listingId: listingId,
                quantity: quantity
            });
            
            return {
                success: true,
                data: {
                    message: response.data.message,
                    cartItem: {
                        id: response.data.cartItem.id,
                        listingId: response.data.cartItem.listingId,
                        quantity: response.data.cartItem.quantity,
                        addedAt: response.data.cartItem.addedAt
                    },
                    cartSummary: {
                        totalItems: response.data.cartSummary.totalItems,
                        totalAmount: response.data.cartSummary.totalAmount
                    }
                },
                message: response.data.message
            };
        } catch (error) {
            console.error('Error adding to cart:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to add item to cart',
                status: error.response?.status
            };
        }
    },

    removeFromCart: async (cartItemId) => {
        try {
            const response = await apiClient.post('/cart/remove/', {
                cartItemId
            });
            
            return {
                success: true,
                data: response.data,
                message: 'Item removed from cart'
            };
        } catch (error) {
            console.error('Error removing from cart:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to remove item from cart',
                status: error.response?.status
            };
        }
    },

    updateCartItemQuantity: async (cartItemId, newQuantity, currentQuantity, foodListingId) => {
        try {
            console.log('Updating cart item:', { cartItemId, newQuantity, currentQuantity, foodListingId });
            
            // If new quantity is 0 or less, remove the item
            if (newQuantity <= 0) {
                const response = await apiClient.post('/cart/remove/', {
                    cartItemId: cartItemId
                });
                
                return {
                    success: response.data?.success || true,
                    data: response.data,
                    message: 'Item removed from cart'
                };
            }
            
            // Calculate the difference
            const quantityDifference = newQuantity - currentQuantity;
            
            if (quantityDifference > 0) {
                // Need to add more items
                const response = await apiClient.post('/cart/add/', {
                    listingId: foodListingId,  // Changed from food_listing_id to listingId
                    quantity: quantityDifference
                });
                
                return {
                    success: response.data?.success || true,
                    data: response.data,
                    message: 'Cart updated successfully'
                };
            } else if (quantityDifference < 0) {
                // Need to reduce quantity - we'll do this by removing and re-adding
                // First remove the entire item
                await apiClient.post('/cart/remove/', {
                    cartItemId: cartItemId
                });
                
                // Then add back the correct quantity
                const response = await apiClient.post('/cart/add/', {
                    listingId: foodListingId,  // Changed from food_listing_id to listingId
                    quantity: newQuantity
                });
                
                return {
                    success: response.data?.success || true,
                    data: response.data,
                    message: 'Cart updated successfully'
                };
            } else {
                // No change needed
                return {
                    success: true,
                    data: {},
                    message: 'No changes needed'
                };
            }
            
        } catch (error) {
            console.error('Error updating cart:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update cart',
                status: error.response?.status
            };
        }
    },
    
    processCheckout: async (checkoutData) => {
        try {
            const response = await apiClient.post('/cart/checkout/', checkoutData);
            
            return {
                success: true,
                data: response.data,
                message: 'Checkout successful'
            };
        } catch (error) {
            console.error('Error processing checkout:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to process checkout',
                status: error.response?.status
            };
        }
    },

    getOrderHistory: async () => {
        try {
            const response = await apiClient.get('/cart/orders/');
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching order history:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch order history',
                status: error.response?.status
            };
        }
    },

    getOrderDetails: async (orderId) => {
        try {
            const response = await apiClient.get(`/cart/orders/${orderId}/`);
            
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching order details:', error);
            
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch order details',
                status: error.response?.status
            };
        }
    },

    transformListingForUI: (apiListing) => {
        return {
            id: apiListing.id,
            title: apiListing.name,
            image: apiListing.imageUrl || (apiListing.images && apiListing.images[0]) || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3',
            provider: apiListing.provider?.business_name || 'Unknown Provider',
            type: apiListing.food_type === 'donation' ? 'Donation' : 'Discount',
            originalPrice: parseFloat(apiListing.original_price || 0),
            discountPrice: parseFloat(apiListing.discounted_price || 0),
            distance: '0.5 km', // Will be calculated based on the user location
            expirationTime: apiListing.expiry_date ? new Date(apiListing.expiry_date).toLocaleDateString() : 'N/A',
            pickupWindow: apiListing.pickup_window,
            quantity: apiListing.quantity_available || apiListing.quantity,
            allergens: apiListing.allergens,
            dietary_info: apiListing.dietary_info,
            is_available: apiListing.is_available
        };
    },

    getErrorMessage: (error) => {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
        if (error.response?.data?.detail) {
            return error.response.data.detail;
        }
        return error.message || 'An unexpected error occurred';
    }
};

export default foodAPI;