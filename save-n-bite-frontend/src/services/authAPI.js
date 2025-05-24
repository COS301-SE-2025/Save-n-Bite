// src/services/authAPI.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper function to transform frontend form data to backend format
const transformFormData = (formData, userType) => {
    switch (userType) {
        case 'customer':
            return {
                email: formData.email,
                password: formData.password,
                full_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
                profile_image: formData.profileImage || '',
            };

        case 'provider':
            return {
                business_email: formData.businessEmail,
                business_name: formData.businessName,
                business_contact: formData.businessContact,
                business_street: formData.addressLine1,
                business_city: formData.city,
                business_province: formData.province,
                business_postal_code: formData.zipCode,
                cipc_document: formData.cipcDocument || '',
                logo: formData.logo || '',
            };

        case 'ngo':
            return {
                representative_email: formData.representativeEmail,
                organisational_email: formData.organisationEmail, // Note: matches serializer field name
                organisation_name: formData.organisationName,
                organisation_contact: formData.organisationContact,
                representative_name: formData.representativeName,
                organisation_street: formData.addressLine1,
                organisation_city: formData.city,
                organisation_province: formData.province,
                organisation_postal_code: formData.zipCode,
                npo_document: formData.npoDocument || '',
                organisation_logo: formData.logo || '', // Note: matches serializer field name
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
                endpoint = '/auth/register/customer';
                break;
            case 'provider':
                endpoint = '/auth/register/provider';
                break;
            case 'ngo':
                endpoint = '/auth/register/ngo';
                break;
            default:
                throw new Error('Invalid user type');
        }

        try {
            const response = await apiClient.post(endpoint, transformedData);
            return response.data;
        } catch (error) {
            // Enhanced error handling
            if (error.response?.data?.error) {
                const backendError = error.response.data.error;
                throw new Error(backendError.message || 'Registration failed');
            }
            
            // Handle Django validation errors
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
            const response = await apiClient.post('/auth/login', credentials);
            
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
            const response = await apiClient.post('/auth/google-signin', { token });
            return response.data;
        } catch (error) {
            if (error.response?.data?.error) {
                const backendError = error.response.data.error;
                throw new Error(backendError.message || 'Google sign-in failed');
            }
            throw new Error(error.message || 'Google sign-in failed');
        }
    }
};