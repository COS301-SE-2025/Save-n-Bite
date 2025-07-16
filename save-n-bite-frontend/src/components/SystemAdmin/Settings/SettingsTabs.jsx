import React from 'react'
import { UserIcon, KeyIcon, BellIcon, GlobeIcon } from 'lucide-react'

const SettingsTabs = ({ activeTab, setActiveTab }) => {
  return (
    <>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
        >
          <option value="profile">Profile</option>
          <option value="security">Security</option>
          <option value="notifications">Notifications</option>
          <option value="system">System Settings</option>
        </select>
      </div>

      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <UserIcon className="mr-2 h-5 w-5" />
              Profile
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <KeyIcon className="mr-2 h-5 w-5" />
              Security
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <BellIcon className="mr-2 h-5 w-5" />
              Notifications
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <GlobeIcon className="mr-2 h-5 w-5" />
              System Settings
            </button>
          </nav>
        </div>
      </div>
    </>
  )
}

export default SettingsTabs
