import React, { useState } from 'react'
import AuditLogFilters from '../components/audit/AuditLogFilters'
import AuditLogTable from '../components/audit/AuditLogTable'
import AuditLogDetails from '../components/audit/AuditLogDetails'

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
      name: 'Hunger Relief',
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
    action: 'Dispute Resolution',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'Transaction TRX004',
      id: 'TRX004',
      type: 'Transaction',
    },
    timestamp: '2023-08-07T16:20:33',
    details: 'Resolved dispute in favor of consumer with partial refund',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
  {
    id: 'LOG005',
    action: 'System Settings Update',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'System Settings',
      id: 'SYS001',
      type: 'System',
    },
    timestamp: '2023-08-06T10:05:17',
    details: 'Updated maximum listing duration from 5 days to 7 days',
    ip: '192.168.1.1',
    userAgent: 'Chrome 115.0.0.0 / Windows',
  },
  {
    id: 'LOG006',
    action: 'Notification Sent',
    user: {
      name: 'Admin User',
      id: 'ADM001',
    },
    target: {
      name: 'All Users',
      id: 'USR000',
      type: 'Users',
    },
    timestamp: '2023-08-05T14:12:09',
    details: 'Sent system maintenance notification to all users',
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

  // Get unique action types for filter
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
