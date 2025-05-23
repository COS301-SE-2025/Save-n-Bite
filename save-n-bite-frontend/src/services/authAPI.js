import axios from 'axios'

const API_BASE_URL =  process.env.REACT_APP_API_BASE_URL || 'https://api.savenbite.org/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type':'application/json',
    },
});

export const authAPI = {
    registerCustomer: async (userData) => {
        const response = await apiClient.post('auth/register/customer',userData);
        return response.data;
    },
    registerProvider: async (providerData) => {
    const response = await apiClient.post('/auth/register/provider', providerData);
    return response.data;
  },
  
  registerNGO: async (ngoData) => {
    const response = await apiClient.post('/auth/register/ngo', ngoData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }
}