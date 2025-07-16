import React from 'react'
import {
  EyeIcon,
  ClipboardListIcon,
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  SettingsIcon,
  BellIcon,
} from 'lucide-react'

const AuditLogTable = ({ logs, onViewDetails }) => {
  const getActionIcon = (action) => {
    if (action.includes('User'))
      return <UserIcon size={16} className="text-blue-600" />
    if (action.includes('Listing'))
      return <ShoppingBagIcon size={16} className="text-purple-600" />
    if (action.includes('Transaction') || action.includes('Dispute'))
      return <CreditCardIcon size={16} className="text-amber-600" />
    if (action.includes('System') || action.includes('Settings'))
      return <SettingsIcon size={16} className="text-gray-600" />
    if (action.includes('Notification'))
      return <BellIcon size={16} className="text-red-600" />
    if (action.includes('Verification'))
      return <ClipboardListIcon size={16} className="text-green-600" />
    return <ClipboardListIcon size={16} className="text-gray-600" />
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {log.action}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.user.name}</div>
                    <div className="text-xs text-gray-500">{log.user.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {log.target.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {log.target.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewDetails(log)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <EyeIcon size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No audit logs found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AuditLogTable
