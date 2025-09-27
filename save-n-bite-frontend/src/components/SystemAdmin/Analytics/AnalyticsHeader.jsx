import React from 'react'
import { CalendarIcon, DownloadIcon } from 'lucide-react'

const AnalyticsHeader = ({ timeframe, setTimeframe }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
      <div className="mt-4 md:mt-0 flex items-center space-x-2">
        <div className="relative inline-flex">
        
        </div>

      </div>
    </div>
  )
}

export default AnalyticsHeader
