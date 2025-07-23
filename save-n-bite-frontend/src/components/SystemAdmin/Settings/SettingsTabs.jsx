import React from 'react'
import { UserIcon, KeyIcon, BellIcon, DatabaseIcon } from 'lucide-react'

const SettingsTabs = ({ activeTab, setActiveTab, isAdmin = false }) => {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon, showFor: 'all' },
    { id: 'security', label: 'Security', icon: KeyIcon, showFor: 'all' },
    { id: 'system', label: 'Database Management', icon: DatabaseIcon, showFor: 'admin' }
  ]

  const visibleTabs = tabs.filter(tab => {
    if (tab.showFor === 'all') return true
    if (tab.showFor === 'admin') return isAdmin
    if (tab.showFor === 'user') return !isAdmin
    return false
  })

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
          {visibleTabs.map(tab => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {visibleTabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}

export default SettingsTabs