import React from 'react'
import { UsersIcon, BuildingIcon, HeartIcon } from 'lucide-react'

const UserTabs = ({ activeTab, setActiveTab, userCounts }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('Consumer')}
            className={`${
              activeTab === 'Consumer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center flex flex-col items-center justify-center`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            Individual Consumers
            <span className="ml-2 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {userCounts.Consumer}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('Provider')}
            className={`${
              activeTab === 'Provider'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center flex flex-col items-center justify-center`}
          >
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <BuildingIcon className="h-5 w-5 text-purple-600" />
            </div>
            Food Providers
            <span className="ml-2 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {userCounts.Provider}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('NGO')}
            className={`${
              activeTab === 'NGO'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center flex flex-col items-center justify-center`}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <HeartIcon className="h-5 w-5 text-green-600" />
            </div>
            NGOs
            <span className="ml-2 mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {userCounts.NGO}
            </span>
          </button>
        </nav>
      </div>
    </div>
  )
}

export default UserTabs
