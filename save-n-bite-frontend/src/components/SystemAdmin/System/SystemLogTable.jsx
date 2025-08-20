import React from 'react'
import {
  EyeIcon,
  AlertTriangleIcon,
  AlertOctagonIcon,
  InfoIcon,
  CheckCircleIcon,
  ClockIcon
} from 'lucide-react'

const SystemLogTable = ({ logs, onViewDetails, onResolve }) => {
  const getLevelIcon = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return <AlertOctagonIcon size={16} className="text-red-600" />
      case 'WARNING':
        return <AlertTriangleIcon size={16} className="text-amber-600" />
      case 'INFO':
        return <InfoIcon size={16} className="text-blue-600" />
      case 'CRITICAL':
        return <AlertOctagonIcon size={16} className="text-red-700" />
      default:
        return <InfoIcon size={16} className="text-gray-600" />
    }
  }

  const getLevelClass = (level) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      case 'WARNING':
        return 'bg-amber-100 text-amber-800'
      case 'INFO':
        return 'bg-blue-100 text-blue-800'
      case 'CRITICAL':
        return 'bg-red-100 text-red-900'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return <CheckCircleIcon size={16} className="text-green-600" />
      case 'open':
        return <ClockIcon size={16} className="text-yellow-600" />
      default:
        return <ClockIcon size={16} className="text-gray-600" />
    }
  }

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'open':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-8 text-center">
          <InfoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No system logs found matching your filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelClass(log.level)}`}
                  >
                    {getLevelIcon(log.level)}
                    <span className="ml-1">{log.level}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {log.message || 'No message'}
                  </div>
                  {log.description && log.description !== log.message && (
                    <div className="text-xs text-gray-500 max-w-xs truncate">
                      {log.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="capitalize">{log.service || 'unknown'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(log.status)}`}
                  >
                    {getStatusIcon(log.status)}
                    <span className="ml-1 capitalize">{log.status || 'open'}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimestamp(log.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onViewDetails(log)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="View Details"
                    >
                      <EyeIcon size={18} />
                    </button>
                    {log.status !== 'resolved' && onResolve && (
                      <button
                        onClick={() => onResolve(log)}
                        className="text-green-600 hover:text-green-900 p-1 rounded text-xs font-medium"
                        title="Mark as Resolved"
                      >
                        <CheckCircleIcon size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SystemLogTable