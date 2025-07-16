import React, { useState, memo } from 'react'
import SystemLogFilters from '../../components/SystemAdmin/System/SystemLogFilters'
import SystemLogTable from '../../components/SystemAdmin/System/SystemLogTable'
import SystemLogDetails from '../../components/SystemAdmin/System/SystemLogDetails'

// Mock data for system logs
const mockSystemLogs = [
  {
    id: 'SYS001',
    level: 'ERROR',
    message: 'Database connection timeout after 30s',
    service: 'Database',
    timestamp: '2023-08-10T14:32:45',
    details:
      'Connection to primary database failed with timeout. Attempted reconnection 3 times. Switched to backup database.',
    stack:
      'Error: Database connection timeout\n  at DatabaseConnection.connect (/app/services/database.js:125)\n  at Server.handleRequest (/app/server.js:45)',
  },
  {
    id: 'SYS002',
    level: 'WARNING',
    message: 'High memory usage detected: 85%',
    service: 'System',
    timestamp: '2023-08-10T12:15:22',
    details:
      'System memory usage has exceeded 85% threshold. Consider scaling up resources if this persists.',
    stack: null,
  },
  {
    id: 'SYS003',
    level: 'INFO',
    message: 'Scheduled backup completed successfully',
    service: 'Backup',
    timestamp: '2023-08-10T03:00:11',
    details:
      'Daily database backup completed and stored in cloud storage. Backup size: 1.2GB',
    stack: null,
  },
  {
    id: 'SYS004',
    level: 'ERROR',
    message: 'Payment gateway API request failed',
    service: 'Payment',
    timestamp: '2023-08-09T16:45:33',
    details:
      'Request to payment gateway API failed with status 503. Transaction ID: TRX004',
    stack:
      'Error: Request failed with status 503\n  at PaymentGateway.processPayment (/app/services/payment.js:87)\n  at TransactionService.complete (/app/services/transaction.js:211)',
  },
  {
    id: 'SYS005',
    level: 'WARNING',
    message: 'Slow query detected (2.5s)',
    service: 'Database',
    timestamp: '2023-08-09T10:22:17',
    details:
      'Query execution time exceeded 2s threshold. Query: SELECT * FROM transactions WHERE status = "pending" AND created_at < "2023-08-01"',
    stack: null,
  },
  {
    id: 'SYS006',
    level: 'INFO',
    message: 'System update applied successfully',
    service: 'System',
    timestamp: '2023-08-08T02:15:09',
    details:
      'System updated to version 2.3.5. Applied 5 security patches and 2 performance improvements.',
    stack: null,
  },
  {
    id: 'SYS007',
    level: 'ERROR',
    message: 'Email notification delivery failed',
    service: 'Notification',
    timestamp: '2023-08-07T14:32:45',
    details:
      'Failed to deliver email notification to user john@example.com. SMTP server returned error code 550.',
    stack:
      'Error: SMTP server returned error code 550\n  at EmailService.send (/app/services/email.js:156)\n  at NotificationService.sendEmail (/app/services/notification.js:87)',
  },
  {
    id: 'SYS008',
    level: 'WARNING',
    message: 'API rate limit approaching threshold',
    service: 'API',
    timestamp: '2023-08-07T11:05:22',
    details: 'External API usage at 85% of daily limit. Service: Geocoding API',
    stack: null,
  },
]

const SystemLogs = () => {
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Filter logs based on search, level, and service
  const filteredLogs = mockSystemLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.service.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = levelFilter === 'All' || log.level === levelFilter
    const matchesService = serviceFilter === 'All' || log.service === serviceFilter
    return matchesSearch && matchesLevel && matchesService
  })

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  // Get unique services for filter
  const services = ['All', ...Array.from(new Set(mockSystemLogs.map((log) => log.service)))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <p className="text-gray-500">Monitor system errors and warnings</p>
      </div>
      <SystemLogFilters
        search={search}
        setSearch={setSearch}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        services={services}
      />
      <SystemLogTable logs={filteredLogs} onViewDetails={handleViewDetails} />
      {showDetailsModal && selectedLog && (
        <SystemLogDetails log={selectedLog} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  )
}

export default SystemLogs
