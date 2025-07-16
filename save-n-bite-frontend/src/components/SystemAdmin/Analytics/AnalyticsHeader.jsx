import React from 'react'
import { CalendarIcon, DownloadIcon } from 'lucide-react'

const AnalyticsHeader = ({ timeframe, setTimeframe }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
      <div className="mt-4 md:mt-0 flex items-center space-x-2">
        <div className="relative inline-flex">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CalendarIcon size={18} className="text-gray-400" />
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 3 Months">Last 3 Months</option>
            <option value="Last 6 Months">Last 6 Months</option>
            <option value="Year to Date">Year to Date</option>
            <option value="All Time">All Time</option>
          </select>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <DownloadIcon size={18} className="mr-2" />
          Export
        </button>
      </div>
    </div>
  )
}

export default AnalyticsHeader
