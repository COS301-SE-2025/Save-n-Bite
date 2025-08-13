import React from 'react'
import { SearchIcon, FilterIcon } from 'lucide-react'

const NotificationFilters = ({ search, setSearch, audienceFilter, setAudienceFilter }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search notifications by title or content..."
            />
          </div>
        </div>
        <div className="relative inline-flex">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterIcon size={18} className="text-gray-400" />
          </div>
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="All">All Audiences</option>
            <option value="All Users">All Users</option>
            <option value="Providers">Providers</option>
            <option value="Consumers">Consumers</option>
            <option value="NGOs">NGOs</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default NotificationFilters
