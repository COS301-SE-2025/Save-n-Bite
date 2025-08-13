import { apiClient } from './FoodAPI.js';


///api/admim/  POST


const AdminAPI = {

ADminInfo: async(user_email) => {

try {
    const response = apiClient.post(`/api/admin` , {
        email : user_email
    })

    return {
        data: response.data,
        success: true,
        error: null

    }
} catch (error) {

     return {
        data: null,
        success: null,
        error: error.response?.data?.message || error.message || "Failed to fetch admin data"


    }
    
}

}


}