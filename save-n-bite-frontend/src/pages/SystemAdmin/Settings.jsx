import React, { useState } from 'react'
import SettingsTabs from '../../components/SystemAdmin/Settings/SettingsTabs'
import ProfileSettings from '../../components/SystemAdmin/Settings/ProfileSettings'
import SecuritySettings from '../../components/SystemAdmin/Settings/SecuritySettings'
import NotificationSettings from '../../components/SystemAdmin/Settings/NotificationSettings'
import SystemSettings from '../../components/SystemAdmin/Settings/SystemSettings'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your account and system settings</p>
      </div>
      <div className="bg-white rounded-lg shadow">
        <SettingsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="p-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'system' && <SystemSettings />}
        </div>
      </div>
    </div>
  )
}

export default Settings
