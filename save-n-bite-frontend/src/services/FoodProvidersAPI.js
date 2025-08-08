import { apiClient } from './FoodAPI.js';

// Export the base URL so it can be used in other components
export const getApiBaseUrl = () => {
    // Get the base URL from the apiClient instance
    return apiClient.defaults.baseURL;
};

const FoodProvidersAPI = {
    // Get all food providers with optional filters
    getAllProviders: async (params = {}) => {
        try {
            // Build query string from params
            const queryParams = new URLSearchParams();
            
            if (params.tags) {
                queryParams.append('tags', Array.isArray(params.tags) ? params.tags.join(',') : params.tags);
            }
            
            if (params.complete_profiles_only !== undefined) {
                queryParams.append('complete_profiles_only', params.complete_profiles_only);
            }
            
            if (params.search) {
                queryParams.append('search', params.search);
            }

            const queryString = queryParams.toString();
            const endpoint = `/auth/providers/${queryString ? `?${queryString}` : ''}`;
            
            const response = await apiClient.get(endpoint);

            return {
                data: response.data,
                success: true,
                error: null
            };
        } catch (error) {
            return {
                data: null,
                success: false,
                error: error.response?.data?.message || error.message || "Failed to fetch providers"
            };
        }
    },

    // Get food provider by ID
    getProviderById: async (providerId) => {
        try {
            const response = await apiClient.get(`/auth/providers/${providerId}/`);

            return {
                data: response.data,
                success: true,
                error: null
            };
        } catch (error) {
            return {
                data: null,
                success: false,
                error: error.response?.data?.message || error.message || "Failed to fetch provider details"
            };
        }
    },

    // Search providers with specific criteria
    searchProviders: async (searchTerm, filters = {}) => {
        try {
            const params = {
                search: searchTerm,
                ...filters
            };

            return await FoodProvidersAPI.getAllProviders(params);
        } catch (error) {
            return {
                data: null,
                success: false,
                error: error.response?.data?.message || error.message || "Failed to search providers"
            };
        }
    },

    // Get providers by specific tags
    getProvidersByTags: async (tags, completeProfilesOnly = false) => {
        try {
            const params = {
                tags: tags,
                complete_profiles_only: completeProfilesOnly
            };

            return await FoodProvidersAPI.getAllProviders(params);
        } catch (error) {
            return {
                data: null,
                success: false,
                error: error.response?.data?.message || error.message || "Failed to fetch providers by tags"
            };
        }
    },

    // Get only providers with complete profiles
    getCompleteProviders: async () => {
        try {
            const params = {
                complete_profiles_only: true
            };

            return await FoodProvidersAPI.getAllProviders(params);
        } catch (error) {
            return {
                data: null,
                success: false,
                error: error.response?.data?.message || error.message || "Failed to fetch complete providers"
            };
        }
    }
};

export default FoodProvidersAPI;