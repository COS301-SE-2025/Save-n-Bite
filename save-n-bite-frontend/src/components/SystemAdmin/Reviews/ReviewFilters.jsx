import React from 'react'
import { SearchIcon, FilterIcon } from 'lucide-react'

const ReviewFilters = ({
  search,
  setSearch,
  ratingFilter,
  setRatingFilter,
  statusFilter,
  setStatusFilter,
}) => {
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
              placeholder="Search reviews by content or user..."
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative inline-flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon size={18} className="text-gray-400" />
            </div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="All">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div className="relative inline-flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon size={18} className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="flagged">Flagged</option>
              <option value="censored">Censored</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewFilters