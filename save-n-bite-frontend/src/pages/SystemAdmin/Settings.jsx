import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import SettingsTabs from '../../components/SystemAdmin/Settings/SettingsTabs'
import ProfileSettings from '../../components/SystemAdmin/Settings/ProfileSettings'
import SecuritySettings from '../../components/SystemAdmin/Settings/SecuritySettings'
import SystemSettings from '../../components/SystemAdmin/Settings/SystemSettings'
import { apiClient } from '../../services/FoodAPI.js'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setupAuth()
  }, [])

  const setupAuth = async () => {
    try {
      // Set up authentication using adminToken
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      
      // Set authorization header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Check if user is admin by checking user_type in stored user data
      const userDataString = localStorage.getItem('userData') || localStorage.getItem('user')
      if (!userDataString) {
        throw new Error('No user data found in localStorage')
      }
      
      const userData = JSON.parse(userDataString)
      const userIsAdmin = userData.user_type === 'admin'
      
      setIsAdmin(userIsAdmin)
      
      if (!userIsAdmin) {
        setError('Access denied. Admin privileges required.')
        toast.error('Admin access required for settings')
      }
      
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError(error.message || 'Authentication failed. Please log in again.')
      toast.error('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">
          {isAdmin ? 'Manage your account and system settings' : 'Manage your account settings'}
        </p>
      </div>
      <div className="bg-white rounded-lg shadow">
        <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} />
        <div className="p-6">
          {activeTab === 'profile' && <ProfileSettings isAdmin={isAdmin} />}
          {activeTab === 'security' && <SecuritySettings isAdmin={isAdmin} />}
          {activeTab === 'system' && isAdmin && <SystemSettings />}
        </div>
      </div>
    </div>
  )
}

export default Settings