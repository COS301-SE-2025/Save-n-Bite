import React, { useState, useEffect } from 'react'
import UserTabs from '../../components/SystemAdmin/Users/UserTabs'
import UserModal from '../../components/SystemAdmin/Users/UserModal'
import UserTable from '../../components/SystemAdmin/Users/UserTable'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'
import { toast } from 'sonner'

// ==================== STEP 1: REMOVE MOCK DATA ====================
// BEFORE: const mockUsers = [...]  Delete this entire array
// AFTER: We'll fetch real data from the backend 

const Users = () => {
  // ==================== STEP 2: ADD INTEGRATION STATE ====================
  // BEFORE: const [users, setUsers] = useState(mockUsers)  
  // AFTER: Add loading/error states + empty initial state 
  
  const [users, setUsers] = useState([])  // Changed: Start with empty array
  const [loading, setLoading] = useState(true)  // Added: Loading state
  const [error, setError] = useState(null)  //  Added: Error state
  
  // UNCHANGED: Keep all your existing UI state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('Consumer')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [processingAction, setProcessingAction] = useState(false)  

  // ==================== STEP 3: ADD AUTHENTICATION + DATA FETCHING ====================
  useEffect(() => {
    setupAuthAndFetchUsers()
  }, [])

  const setupAuthAndFetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      await fetchUsers()
      
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
      setLoading(false)
    }
  }

  // ==================== STEP 4: REPLACE MOCK DATA WITH API CALLS ====================
  // Added: This entire function is new
  const fetchUsers = async () => {
    try {
      setLoading(true)
      console.log('Fetching users from API...')
      
      // STEP 4A: Call our AdminAPI service (which calls /api/admin/users/)
      const response = await AdminAPI.getAllUsers(1, '', 'All', 'All', 20) // Get more users
      //console.log('Users API response:', response)
      
      if (response.success) {
        // STEP 4B: Store the real data
        setUsers(response.data.users)
        setError(null)
        console.log('Users loaded successfully:', response.data.users.length, 'users')
      } else {
        console.error('Users API error:', response.error)
        setError(response.error)
        toast.error(response.error || 'Failed to load users')
      }
    } catch (error) {
      console.error('Users fetch error:', error)
      
      // STEP 4C: Handle different error types
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.')
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.')
      } else {
        setError('Failed to fetch users')
      }
      
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  // ==================== STEP 5: UPDATE FILTER LOGIC ====================
  //  Changed: Made filtering more robust (handle missing data)
  const filteredUsers = users.filter((user) => {
    const matchesRole = user.role === activeTab
    const matchesSearch =
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.id?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter
    return matchesRole && matchesSearch && matchesStatus
  })

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleConfirmAction = (type, userId) => {
    setConfirmAction({ type, userId })
    setShowConfirmModal(true)
  }

  // ==================== STEP 6: REPLACE LOCAL STATE UPDATES WITH API CALLS ====================
  // Changed: Replace local state manipulation with real API calls
  const executeAction = async () => {
    if (!confirmAction || processingAction) return

    setProcessingAction(true)  // Show loading state

    try {
      const { type, userId } = confirmAction
      //console.log(`Processing ${type} for user ${userId}`)

      if (type === 'deactivate') {
        // BEFORE: Just updated local state 
        // AFTER: Call real API 
        const response = await AdminAPI.toggleUserStatus(userId, `Admin ${type} action`)
        
        if (response.success) {
          // Update local state after successful API call
          setUsers(prevUsers =>
            prevUsers.map(user =>
              user.id === userId
                ? { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' }
                : user
            )
          )
          
          const action = users.find(u => u.id === userId)?.status === 'Active' ? 'deactivated' : 'activated'
          toast.success(`User ${userId} has been ${action}`)
        } else {
          toast.error(response.error || 'Failed to update user status')
        }
        
      } else if (type === 'resetPassword') {
        // BEFORE: Just showed fake success message 
        // AFTER: Call real API 
        const response = await AdminAPI.resetUserPassword(userId, 'Admin password reset')
        
        if (response.success) {
          toast.success(`Password reset email sent to user ${userId}`)
        } else {
          toast.error(response.error || 'Failed to reset password')
        }
      }

      // Close modals
      setShowConfirmModal(false)
      setConfirmAction(null)
      
    } catch (error) {
      console.error('Error executing action:', error)
      toast.error(`Failed to ${confirmAction.type} user`)
    } finally {
      setProcessingAction(false)
    }
  }

  // ==================== STEP 7: UPDATE USER COUNTS ====================
  // Changed: Calculate counts from real data (not mock data)
  const userCounts = {
    Consumer: users.filter((user) => user.role === 'Consumer').length,
    Provider: users.filter((user) => user.role === 'Provider').length,
    NGO: users.filter((user) => user.role === 'NGO').length,
  }

  // ==================== STEP 8: ADD LOADING STATE ====================
  // ➕ Added: Show loading skeleton while fetching data
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        </div>
        
        {/* Tabs skeleton */}
        <div className="flex space-x-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded px-6 animate-pulse"></div>
          ))}
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow animate-pulse">
          <div className="p-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4 border-b">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ==================== STEP 9: ADD ERROR STATE ====================
  // ➕ Added: Show error message with retry option
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={fetchUsers}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==================== STEP 10: MAIN RENDER (MOSTLY UNCHANGED) ====================
  // Minor changes: Add processing state to confirmation modal
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">Manage all platform users</p>
      </div>
      
      <UserTabs activeTab={activeTab} setActiveTab={setActiveTab} userCounts={userCounts} />
      
      <UserTable
        users={filteredUsers}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeTab={activeTab}
        onViewUser={handleViewUser}
        onActionClick={handleConfirmAction}
      />
      
      {showUserModal && selectedUser && (
        <UserModal user={selectedUser} onClose={() => setShowUserModal(false)} />
      )}
      
      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'deactivate'
              ? users.find((u) => u.id === confirmAction.userId)?.status === 'Active'
                ? 'Deactivate User'
                : 'Activate User'
              : 'Reset User Password'
          }
          message={
            confirmAction.type === 'deactivate'
              ? users.find((u) => u.id === confirmAction.userId)?.status === 'Active'
                ? 'Are you sure you want to deactivate this user? They will not be able to log in or use the platform until reactivated.'
                : 'Are you sure you want to reactivate this user? They will be able to log in and use the platform again.'
              : "Are you sure you want to reset this user's password? They will receive an email with instructions to set a new password."
          }
          confirmButtonText={processingAction ? 'Processing...' : 'Confirm'}  // Changed: Show loading
          confirmButtonColor={
            confirmAction.type === 'deactivate'
              ? users.find((u) => u.id === confirmAction.userId)?.status === 'Active'
                ? 'red'
                : 'green'
              : 'blue'
          }
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
          disabled={processingAction}  //  Changed: Disable while processing
        />
      )}
    </div>
  )
}

export default Users