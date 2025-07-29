import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://savenbiteservice-hzghg8gcgddtcfg7.southafricanorth-01.azurewebsites.net';

const API_BASE_URL = 'http://localhost:8000' ;

const apiClient = axios.create({
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

// COMPLETELY REMOVED automatic logout/redirect logic
// Let components handle their own authentication errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Just log errors for debugging, no automatic actions
        if (error.response?.status === 401) {
            console.log('401 response received for:', error.config?.url);
        }
        
        return Promise.reject(error);
    }
);

// Helper function to transform frontend form data to backend format
const transformFormData = (formData, userType) => {
    switch (userType) {
        case 'customer':
            return {
                email: formData.email,
                password: formData.password,
                username: formData.email, // Use email as username
                role: 'normal', // Add role field
                full_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
                profile_image: formData.profileImage || '',
            };

        case 'provider':
            return {
                email: formData.email,
                password: formData.password,
                username: formData.email, // Use email as username
                role: 'normal', // Add role field
                business_email: formData.businessEmail,
                business_name: formData.businessName,
                business_contact: formData.businessContact,
                business_street: formData.addressLine1,
                business_city: formData.city,
                business_province: formData.province,
                business_postal_code: formData.zipCode,
                cipc_document: formData.cipcDocument || '',
                logo: formData.logo || '',
                user_type: 'provider'  // Add user_type explicitly
            };

        case 'ngo':
            return {
                email: formData.email,
                password: formData.password,
                username: formData.email, // Use email as username
                role: 'normal', // Add role field
                organisational_email: formData.organisationEmail,
                organisation_name: formData.organisationName,
                organisation_contact: formData.organisationContact,
                representative_name: formData.representativeName,
                representative_email: 'john@gmail.com',
                organisation_street: formData.addressLine1,
                organisation_city: formData.city,
                organisation_province: formData.province,
                organisation_postal_code: formData.zipCode,
                npo_document: formData.npoDocument || '',
                organisation_logo: formData.logo || '',
            };

        default:
            return formData;
    }
};

export const authAPI = {
    register: async (formData) => {
        const { userType, ...data } = formData;
        const transformedData = transformFormData(data, userType);

        let endpoint;
        switch (userType) {
            case 'customer':
                endpoint = '/auth/register/customer/';
                break;
            case 'provider':
                endpoint = '/auth/register/provider/';
                break;
            case 'ngo':
                endpoint = '/auth/register/ngo/';
                break;
            default:
                throw new Error('Invalid user type');
        }

        try {
            console.log('Sending registration data:', transformedData); // Debug log
            const response = await apiClient.post(endpoint, transformedData);
            return response.data;
        } catch (error) {
            console.error('Registration error:', error.response?.data); // Debug log
            console.error('Full error response:', error.response); // More detailed error info
            console.error('Error response data:', JSON.stringify(error.response?.data, null, 2)); // Expanded error data
            
            // Enhanced error handling
            if (error.response?.data?.error) {
                const backendError = error.response.data.error;
                console.error('Backend error details:', JSON.stringify(backendError, null, 2));
                
                // Check for specific error types
                if (backendError.details && backendError.details.length > 0) {
                    const firstDetail = backendError.details[0];
                    if (firstDetail.message && firstDetail.message.includes('duplicate key value')) {
                        if (firstDetail.message.includes('username')) {
                            throw new Error('This email address is already registered. Please use a different email or try logging in.');
                        } else if (firstDetail.message.includes('email')) {
                            throw new Error('This email address is already registered. Please use a different email or try logging in.');
                        }
                    }
                }
                
                throw new Error(backendError.message || 'Registration failed');
            }
            
            // Handle Django validation errors
            if (error.response?.data) {
                const errorData = error.response.data;
                console.error('Error data:', JSON.stringify(errorData, null, 2)); // Log the error data
                
                if (typeof errorData === 'object') {
                    // Extract first error message from validation errors
                    const firstError = Object.values(errorData)[0];
                    if (Array.isArray(firstError)) {
                        throw new Error(firstError[0]);
                    } else if (typeof firstError === 'string') {
                        throw new Error(firstError);
                    }
                }
            }
            
            throw new Error(error.message || 'Registration failed');
        }
    },

    // Legacy methods for backward compatibility
    registerCustomer: async (userData) => {
        return authAPI.register({ ...userData, userType: 'customer' });
    },

    registerProvider: async (providerData) => {
        return authAPI.register({ ...providerData, userType: 'provider' });
    },

    registerNGO: async (ngoData) => {
        return authAPI.register({ ...ngoData, userType: 'ngo' });
    },

    login: async (credentials) => {
        try {
            const response = await apiClient.post('/auth/login/', credentials);
            
            // Return the response data as-is since the backend already provides the correct structure
            return response.data;
        } catch (error) {
            // Handle structured error responses from Django
            if (error.response?.data?.error) {
                const backendError = error.response.data.error;
                throw new Error(backendError.message || 'Login failed');
            }
            
            // Handle non-structured error responses
            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object') {
                    // Extract first error message from validation errors
                    const firstError = Object.values(errorData)[0];
                    if (Array.isArray(firstError)) {
                        throw new Error(firstError[0]);
                    } else if (typeof firstError === 'string') {
                        throw new Error(firstError);
                    }
                }
            }
            
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    },

    googleSignin: async (token) => {
        try {
            const response = await apiClient.post('/auth/google-signin/', { token });
            return response.data;
        } catch (error) {
            if (error.response?.data?.error) {
                const backendError = error.response.data.error;
                throw new Error(backendError.message || 'Google sign-in failed');
            }
            throw new Error(error.message || 'Google sign-in failed');
        }
    },
};