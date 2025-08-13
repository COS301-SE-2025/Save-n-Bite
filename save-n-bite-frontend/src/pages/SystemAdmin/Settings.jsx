import React, { useState, useContext } from 'react'
import SettingsTabs from '../../components/SystemAdmin/Settings/SettingsTabs'
import ProfileSettings from '../../components/SystemAdmin/Settings/ProfileSettings'
import SecuritySettings from '../../components/SystemAdmin/Settings/SecuritySettings'
import SystemSettings from '../../components/SystemAdmin/Settings/SystemSettings'
// You'll need to import your auth context or user context
// import { AuthContext } from '../../context/AuthContext'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  
  // Get user info from context or props
  // const { user } = useContext(AuthContext)
  
  // For demonstration, you can determine admin status like this:
  // Replace with your actual user context/auth logic
  const isAdmin = true // Replace with: user?.admin_rights || user?.is_staff || user?.user_type === 'admin'

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