import React from 'react'
import { SearchIcon, FilterIcon, XIcon } from 'lucide-react'

const SystemLogFilters = ({
  search,
  setSearch,
  levelFilter,
  setLevelFilter,
  serviceFilter,
  setServiceFilter,
  statusFilter,
  setStatusFilter,
  services
}) => {
  const clearFilters = () => {
    setSearch('')
    setLevelFilter('All')
    setServiceFilter('All')
    setStatusFilter('All')
  }

  const hasActiveFilters = search || levelFilter !== 'All' || serviceFilter !== 'All' || statusFilter !== 'All'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FilterIcon className="w-5 h-5 mr-2 text-gray-500" />
          Filter System Logs
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <XIcon className="w-4 h-4 mr-1" />
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Logs
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by message, title, or details..."
            />
          </div>
        </div>

        {/* Severity Filter */}
        <div>
          <label htmlFor="levelFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Severity Level
          </label>
          <select
            id="levelFilter"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="All">All Levels</option>
            <option value="Critical">Critical</option>
            <option value="Error">Error</option>
            <option value="Warning">Warning</option>
            <option value="Info">Info</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Service Filter - Moved to second row or collapsed on smaller screens */}
        <div className="md:col-span-2 lg:col-span-1">
          <label htmlFor="serviceFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="serviceFilter"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {services.map((service) => (
              <option key={service} value={service}>
                {service === 'All' ? 'All Categories' : service.charAt(0).toUpperCase() + service.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{search}"
                <button
                  onClick={() => setSearch('')}
                  className="ml-1 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            )}

            {levelFilter !== 'All' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Level: {levelFilter}
                <button
                  onClick={() => setLevelFilter('All')}
                  className="ml-1 inline-flex items-center p-0.5 rounded-full text-yellow-400 hover:bg-yellow-200 hover:text-yellow-600"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'All' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter('All')}
                  className="ml-1 inline-flex items-center p-0.5 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            )}

            {serviceFilter !== 'All' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Category: {serviceFilter.charAt(0).toUpperCase() + serviceFilter.slice(1)}
                <button
                  onClick={() => setServiceFilter('All')}
                  className="ml-1 inline-flex items-center p-0.5 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemLogFilters