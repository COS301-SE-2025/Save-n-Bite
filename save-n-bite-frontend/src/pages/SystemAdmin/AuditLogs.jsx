import React, { useState, useEffect } from 'react'
import AuditLogFilters from '../../components/SystemAdmin/Audit/AuditLogFilters'
import AuditLogTable from '../../components/SystemAdmin/Audit/AuditLogTable'
import AuditLogDetails from '../../components/SystemAdmin/Audit/AuditLogDetails'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'
import { toast } from 'sonner'
import { RefreshCwIcon, DownloadIcon, AlertCircleIcon } from 'lucide-react'

const AuditLogs = () => {
  // Data state
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter state
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Authentication setup
  useEffect(() => {
    setupAuthAndFetchLogs()
  }, [])

  const setupAuthAndFetchLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      await fetchAuditLogs()
      
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
      setLoading(false)
    }
  }

  /**
   * Fetch audit logs from backend using correct AdminAPI method and signature
   */
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Convert date filter to actual dates
      let startDate = ''
      let endDate = ''
      
      if (dateFilter === 'Today') {
        startDate = new Date().toISOString().split('T')[0]
        endDate = startDate
      } else if (dateFilter === 'This Week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      } else if (dateFilter === 'This Month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      }

      // Convert action filter
      const actionType = actionFilter === 'All' ? '' : actionFilter.toLowerCase().replace(' ', '_')

      // Use correct AdminAPI method signature
      const response = await AdminAPI.getAdminActionLogs(
        currentPage,      // page
        search,           // search
        actionType,       // actionType
        startDate,        // startDate
        endDate,          // endDate
        20                // perPage
      )

      if (response.success) {
        // Transform the log data to match your UI expectations
        const transformedLogs = response.data.logs.map(log => ({
          id: log.id,
          action: formatActionType(log.action_type),
          user: {
            name: log.admin_name,
            id: log.admin_email, // Using email as ID since it's available
          },
          target: {
            name: getTargetName(log),
            id: log.target_id,
            type: formatTargetType(log.target_type),
          },
          timestamp: log.timestamp,
          details: log.action_description,
          ip: log.ip_address,
          metadata: log.metadata
        }))

        setLogs(transformedLogs)
        setTotalCount(response.data.pagination?.total_count || 0)
        setTotalPages(response.data.pagination?.total_pages || 1)
        setCurrentPage(response.data.pagination?.current_page || 1)
      } else {
        throw new Error(response.error || 'Failed to fetch audit logs')
      }

    } catch (err) {
      console.error('Audit logs fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Transform backend action types to display format
   */
  const formatActionType = (actionType) => {
    const actionMap = {
      'user_management': 'User Management',
      'user_verification': 'User Verification',
      'data_export': 'Data Export',
      'custom_notification': 'System Announcement',
      'password_reset': 'Password Reset',
      'listing_moderation': 'Listing Moderation'
    }
    return actionMap[actionType] || actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  /**
   * Transform backend target types to display format
   */
  const formatTargetType = (targetType) => {
    const typeMap = {
      'user': 'User',
      'listing': 'Listing',
      'notification': 'Announcement',
      'export': 'Export'
    }
    return typeMap[targetType] || targetType.charAt(0).toUpperCase() + targetType.slice(1)
  }

  /**
   * Get target name from log metadata or use target_id
   */
  const getTargetName = (log) => {
    if (log.metadata) {
      // Try to extract name from metadata
      if (log.metadata.user_email) return log.metadata.user_email
      if (log.metadata.subject) return log.metadata.subject
      if (log.metadata.export_type) return `${log.metadata.export_type} Export`
    }
    return log.target_id || 'Unknown'
  }

  /**
   * Handle export functionality
   */
  const handleExport = async () => {
    try {
      // Convert filters for export
      let startDate = ''
      let endDate = ''
      
      if (dateFilter === 'Today') {
        startDate = new Date().toISOString().split('T')[0]
        endDate = startDate
      } else if (dateFilter === 'This Week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      } else if (dateFilter === 'This Month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      }

      const response = await AdminAPI.exportData('audit_logs', startDate, endDate)

      if (response.success) {
        // Create download link for the exported file
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        window.URL.revokeObjectURL(url)
        toast.success('Audit logs exported successfully')
      } else {
        toast.error('Failed to export audit logs')
      }
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Failed to export audit logs')
    }
  }

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchAuditLogs()
    toast.success('Audit logs refreshed')
  }

  /**
   * Handle retry when there's an error
   */
  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    await fetchAuditLogs()
  }

  /**
   * Load data when filters change
   */
  useEffect(() => {
    if (!loading) { // Only refetch if not in initial load
      fetchAuditLogs()
    }
  }, [search, actionFilter, dateFilter, currentPage])

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  // Get unique action types for filter from current logs
  const actionTypes = [
    'All',
    ...Array.from(new Set(logs.map((log) => log.action))),
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <RefreshCwIcon className="w-4 h-4 mr-2 inline" />
              Refresh
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <DownloadIcon className="w-4 h-4 mr-2 inline" />
              Export
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-500">Loading audit logs...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Audit Logs</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-2">
            View detailed logs of admin actions ({totalCount} total records)
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <DownloadIcon className="w-4 h-4 mr-2 inline" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <AuditLogFilters
        search={search}
        setSearch={setSearch}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        actionTypes={actionTypes}
      />
      
      {/* Audit Logs Table */}
      <AuditLogTable logs={logs} onViewDetails={handleViewDetails} />
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{currentPage}</span> of{' '}
                <span className="font-medium">{totalPages}</span> ({totalCount} total results)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <AuditLogDetails
          log={selectedLog}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Backend Connection Status */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="flex items-center text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full mr-2 ${logs.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {logs.length > 0 ? 'Connected to audit log API' : 'No audit logs available'}
        </div>
      </div>
    </div>
  )
}

export default AuditLogs