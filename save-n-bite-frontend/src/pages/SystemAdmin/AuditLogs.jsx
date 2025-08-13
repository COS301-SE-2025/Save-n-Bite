import React, { useState } from 'react'
import AuditLogFilters from '../../components/SystemAdmin/Audit/AuditLogFilters'
import AuditLogTable from '../../components/SystemAdmin/Audit/AuditLogTable'
import AuditLogDetails from '../../components/SystemAdmin/Audit/AuditLogDetails'

// Mock data for audit logs
const mockAuditLogs = [
  {
    id: 'LOG001',
    action: 'User Deactivation',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'Alex Johnson',
      id: 'USR007',
      type: 'User',
    },
    timestamp: '2023-08-10T14:32:45',
    details: 'Deactivated user account due to suspicious activity',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
  {
    id: 'LOG002',
    action: 'Verification Approval',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'Hunger Relief Organization',
      id: 'USR010',
      type: 'NGO',
    },
    timestamp: '2023-08-09T11:15:22',
    details: 'Approved NGO verification request after document review',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
  {
    id: 'LOG003',
    action: 'Listing Removal',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'Prepared Meals - 5 Pack',
      id: 'LST004',
      type: 'Listing',
    },
    timestamp: '2023-08-08T09:45:11',
    details: 'Removed listing due to food safety concerns',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
  {
    id: 'LOG004',
    action: 'System Announcement',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'System Maintenance Notification',
      id: 'TRX004',
      type: 'Announcement',
    },
    timestamp: '2023-08-07T16:20:33',
    details: 'Created system maintenance notification for all users',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
  {
    id: 'LOG005',
    action: 'Data Export',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'User Data Export',
      id: 'SYS001',
      type: 'Export',
    },
    timestamp: '2023-08-06T10:05:17',
    details: 'Exported user data for compliance audit (1,247 records)',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
  {
    id: 'LOG006',
    action: 'Password Reset',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'John Smith',
      id: 'USR000',
      type: 'User',
    },
    timestamp: '2023-08-05T14:12:09',
    details: 'Reset password for user upon verified request',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
]

const AuditLogs = () => {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Filter logs based on search, action, and date
  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.target.name.toLowerCase().includes(search.toLowerCase()) ||
      log.user.name.toLowerCase().includes(search.toLowerCase())

    const matchesAction = actionFilter === 'All' || log.action === actionFilter

    let matchesDate = true
    if (dateFilter === 'Today') {
      const today = new Date().toISOString().split('T')[0]
      matchesDate = log.timestamp.startsWith(today)
    } else if (dateFilter === 'This Week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      matchesDate = new Date(log.timestamp) >= weekAgo
    } else if (dateFilter === 'This Month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      matchesDate = new Date(log.timestamp) >= monthAgo
    }

    return matchesSearch && matchesAction && matchesDate
  })

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  // Get unique action types for filter - THIS WAS THE MISSING PROP!
  const actionTypes = [
    'All',
    ...Array.from(new Set(mockAuditLogs.map((log) => log.action))),
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500">View detailed logs of admin actions</p>
      </div>
      
      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Demo Mode</h3>
            <p className="text-sm text-blue-700 mt-1">
              Currently showing mock audit logs. This demonstrates the functionality before API integration.
            </p>
          </div>
        </div>
      </div>

      {/* Pass the actionTypes prop that was missing! */}
      <AuditLogFilters
        search={search}
        setSearch={setSearch}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        actionTypes={actionTypes}
      />
      
      <AuditLogTable logs={filteredLogs} onViewDetails={handleViewDetails} />
      
      {showDetailsModal && selectedLog && (
        <AuditLogDetails
          log={selectedLog}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  )
}

export default AuditLogs