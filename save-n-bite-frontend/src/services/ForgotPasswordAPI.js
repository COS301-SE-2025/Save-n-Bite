import { apiClient } from './FoodAPI.js';

const ForgotPassword = {

  ResetPassword: async(user_email) => {
    try {
      const response = await apiClient.post(`/auth/forgot-password/`, {email: user_email});

      return {
        success: true,
        error: null,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || "Could not reset your password"
      }
    }
  },

  LoginEnhanced: async(user_email, user_password) => {
    try {
      const response = await apiClient.post(`/auth/login-enhanced/`, {
        email: user_email,
        password: user_password
      });

      return {
        success: true,
        error: null,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || "Failed to login"
      }
    }
  },

  CheckPasswordStatus: async(token) => {
    try {
      const response = await apiClient.get(`/auth/password-status/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        error: null,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || "Failed to check password status"
      }
    }
  },

  ChangeTemporaryPassword: async(token, current_password, new_password, confirm_password) => {
    try {
      const response = await apiClient.post(`/auth/change-temporary-password/`, {
        current_password,
        new_password,
        confirm_password
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        error: null,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || error.message || "Failed to change password"
      }
    }
  }

}

export default ForgotPassword;