import React, { useState } from 'react'
import {
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
  XIcon,
  EyeIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  DownloadIcon,
} from 'lucide-react'

// Mock data for audit logs
const mockAuditLogs = [
  {
    id: 'LOG001',
    adminId: 'ADMIN001',
    adminName: 'John Admin',
    action: 'User Deactivation',
    details: 'Deactivated user USR005 (Green Grocers)',
    timestamp: '2023-08-10T14:32:45',
    ip: '192.168.1.1',
  },
  {
    id: 'LOG002',
    adminId: 'ADMIN001',
    adminName: 'John Admin',
    action: 'Verification Approval',
    details: 'Approved verification request VR001 (Community Food Bank)',
    timestamp: '2023-08-10T12:18:22',
    ip: '192.168.1.1',
  },
  {
    id: 'LOG003',
    adminId: 'ADMIN002',
    adminName: 'Jane Admin',
    action: 'Listing Removal',
    details: 'Removed listing LST005 (Fruits Assortment) due to reports',
    timestamp: '2023-08-09T16:45:30',
    ip: '192.168.1.2',
  },
  {
    id: 'LOG004',
    adminId: 'ADMIN002',
    adminName: 'Jane Admin',
    action: 'Dispute Resolution',
    details: 'Resolved dispute for transaction TRX004 (Prepared Meals - 5 Pack)',
    timestamp: '2023-08-09T11:23:18',
    ip: '192.168.1.2',
  },
  {
    id: 'LOG005',
    adminId: 'ADMIN001',
    adminName: 'John Admin',
    action: 'Notification Sent',
    details: 'Sent notification "Platform Maintenance" to All Users',
    timestamp: '2023-08-08T09:12:05',
    ip: '192.168.1.1',
  },
  {
    id: 'LOG006',
    adminId: 'ADMIN003',
    adminName: 'Alex Admin',
    action: 'User Password Reset',
    details: 'Reset password for user USR007 (Alex Johnson)',
    timestamp: '2023-08-08T08:55:41',
    ip: '192.168.1.3',
  },
  {
    id: 'LOG007',
    adminId: 'ADMIN003',
    adminName: 'Alex Admin',
    action: 'Verification Rejection',
    details: 'Rejected verification request VR005 (Hunger Relief) - Incomplete documentation',
    timestamp: '2023-08-07T15:37:29',
    ip: '192.168.1.3',
  },
  {
    id: 'LOG008',
    adminId: 'ADMIN002',
    adminName: 'Jane Admin',
    action: 'Listing Featured',
    details: 'Featured listing LST002 (Bread and Pastries)',
    timestamp: '2023-08-07T14:22:10',
    ip: '192.168.1.2',
  },
  {
    id: 'LOG009',
    adminId: 'ADMIN001',
    adminName: 'John Admin',
    action: 'Refund Issued',
    details: 'Issued refund for transaction TRX005 (Fresh Vegetables Bundle)',
    timestamp: '2023-08-06T17:05:33',
    ip: '192.168.1.1',
  },
  {
    id: 'LOG010',
    adminId: 'ADMIN003',
    adminName: 'Alex Admin',
    action: 'User Activation',
    details: 'Activated user USR009 (Sarah Williams)',
    timestamp: '2023-08-06T10:48:52',
    ip: '192.168.1.3',
  },
]

const AuditLogs = () => {
  const [logs] = useState(mockAuditLogs)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [adminFilter, setAdminFilter] = useState('All')
  const [dateRange, setDateRange] = useState('Last 7 Days')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showLogModal, setShowLogModal] = useState(false)

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(search.toLowerCase()) ||
      log.adminName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
    const matchesAction = actionFilter === 'All' || log.action === actionFilter
    const matchesAdmin = adminFilter === 'All' || log.adminName === adminFilter
    return matchesSearch && matchesAction && matchesAdmin
  })

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)))
  const uniqueAdmins = Array.from(new Set(logs.map((log) => log.adminName)))

  const handleViewLog = (log) => {
    setSelectedLog(log)
    setShowLogModal(true)
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'User Deactivation':
      case 'Verification Rejection':
        return <XIcon size={16} className="text-red-500" />
      case 'User Activation':
      case 'Verification Approval':
      case 'Dispute Resolution':
        return <CheckIcon size={16} className="text-green-500" />
      case 'Listing Removal':
        return <AlertTriangleIcon size={16} className="text-amber-500" />
      case 'Listing Featured':
      case 'Notification Sent':
        return <EyeIcon size={16} className="text-blue-500" />
      case 'Refund Issued':
      case 'User Password Reset':
        return <RefreshCwIcon size={16} className="text-amber-500" />
      default:
        return <EyeIcon size={16} className="text-gray-500" />
    }
  }

  return (
  <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <DownloadIcon size={18} className="mr-2" />
            Export Logs
          </button>
        </div>
      </div>
      {/* Filters */}
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
                placeholder="Search logs..."
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative inline-flex">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FilterIcon size={18} className="text-gray-400" />
              </div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="All">All Actions</option>
                {uniqueActions.map((action, index) => (
                  <option key={index} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative inline-flex">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon size={18} className="text-gray-400" />
              </div>
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="All">All Admins</option>
                {uniqueAdmins.map((admin, index) => (
                  <option key={index} value={admin}>
                    {admin}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative inline-flex">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon size={18} className="text-gray-400" />
              </div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Log ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Admin
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Details
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Timestamp
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  View
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.adminName}
                      <div className="text-xs text-gray-400">{log.adminId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getActionIcon(log.action)}
                        <span className="ml-2 text-sm text-gray-900">
                          {log.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewLog(log)}
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
                    colSpan={6}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Log Detail Modal */}
      {showLogModal && selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Log Details
                      </h3>
                      <button
                        onClick={() => setShowLogModal(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XIcon size={20} />
                      </button>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Log ID
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLog.id}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Admin
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLog.adminName} ({selectedLog.adminId})
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Action
                        </h4>
                        <div className="mt-1 flex items-center">
                          {getActionIcon(selectedLog.action)}
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedLog.action}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Details
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLog.details}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          Timestamp
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedLog.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">
                          IP Address
                        </h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedLog.ip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditLogs
