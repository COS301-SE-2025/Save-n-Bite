import { apiClient } from './FoodAPI.js';


const ForgotPassword = {


  ResetPassword: async(user_email) =>{

    try {
        
        const response = await apiClient.post(`/auth/forgot-password/`, {email : user_email});

        return{
            success: true,
            error: null,
            data: response.data
        }

    } catch (error) {

        return{
            error: true,
            success: null,
            error: error.response?.data?.message || error.message || "Could not reset your password"
        }
        
    }

  },

  LoginEnhanced: async(user_email, user_password) => {

try {

    const response = await apiClient.post(`/auth/login-enhanced/`, {
        email: user_email,
        password: user_password
    })


    return{

        success: true,
        error: null,
        data: response.data
    }
    
} catch (error) {

    return{

        success: null,
        data: null,
        error: true,
        error: error.response?.data?.message || error.message || "Failed to reset the password"
    }
    
}








  }





}
export default ForgotPassword
