import React, { useState } from 'react'
import { toast } from 'sonner'
import { LockIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../services/FoodAPI.js'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setDebugInfo('Starting login request...')
    
    try {
      console.log('=== ADMIN LOGIN DEBUG ===')
      console.log('Email:', email)
      console.log('Making request to /auth/login/')
      
      // Use your existing login endpoint
      const response = await apiClient.post('/auth/login/', {
        email: email,
        password: password
      })
      
      //console.log('✅ Login response received:', response.data)
      setDebugInfo('Login successful, checking admin rights...')
      
      const userData = response.data.user
      // console.log('User data:', userData)
      // console.log('User role:', userData.role)
      // console.log('Admin rights:', userData.admin_rights)
      // console.log('Is superuser:', userData.is_superuser)
      
      // Check if user has admin rights - check user_type for "admin"
      const hasAdminRights = (
        userData.user_type === 'admin' || 
        userData.role === 'admin' || 
        userData.admin_rights === true || 
        userData.is_superuser === true ||
        // Also check if these fields exist as strings
        userData.admin_rights === 'true' ||
        userData.is_superuser === 'true'
      )
      
      //console.log('Has admin rights:', hasAdminRights)
      setDebugInfo(`Admin rights check: ${hasAdminRights}`)
      
      if (hasAdminRights) {
        console.log('✅ User has admin rights, storing session data...')
        
        // Store admin session data
        localStorage.setItem('adminUser', JSON.stringify(userData))
        localStorage.setItem('adminToken', response.data.token)
        localStorage.setItem('userEmail', email)
        
        // Set token for future API calls
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
        
        console.log('✅ Session data stored, redirecting...')
        setDebugInfo('Admin login successful! Redirecting...')
        
        toast.success('Admin login successful')
        navigate('/admin-dashboard')
      } else {
        console.log('❌ User does not have admin rights')
        setDebugInfo('Access denied: No admin privileges found')
        toast.error('Access denied: Admin privileges required')
        
        // Show detailed debug info
        // console.log('User object details:')
        // console.log('- role:', typeof userData.role, userData.role)
        // console.log('- admin_rights:', typeof userData.admin_rights, userData.admin_rights) 
        // console.log('- is_superuser:', typeof userData.is_superuser, userData.is_superuser)
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      
      if (error.response) {
        console.log('Error response status:', error.response.status)
        console.log('Error response data:', error.response.data)
        setDebugInfo(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`)
        
        if (error.response.status === 401) {
          toast.error('Invalid email or password')
        } else if (error.response.status === 403) {
          toast.error('Account pending verification or disabled')
        } else {
          toast.error(`Server error: ${error.response.status}`)
        }
      } else if (error.request) {
        console.log('No response received:', error.request)
        setDebugInfo('No response from server - check if backend is running')
        toast.error('No response from server - check connection')
      } else {
        console.log('Request setup error:', error.message)
        setDebugInfo(`Request error: ${error.message}`)
        toast.error('Request failed to send')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-green-600 py-6 px-6 text-white text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
            <LockIcon className="text-green-600" size={28} />
          </div>
          <h2 className="text-2xl font-bold">Admin Login</h2>
          <p className="mt-1 text-green-100">Save n Bite Platform</p>
        </div>
        
        {/* Debug Info Panel */}
        {debugInfo && (
          <div className="bg-gray-50 px-6 py-3 border-b">
            <p className="text-xs text-gray-600">
              <strong>Debug:</strong> {debugInfo}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="py-8 px-6 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="sabfa24@gmail.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </a>
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
        
        {/* Console log reminder
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500">
            💡 Check browser console (F12) for detailed debug information
          </p>
        </div> */}
      </div>
    </div>
  )
}

export default AdminLogin