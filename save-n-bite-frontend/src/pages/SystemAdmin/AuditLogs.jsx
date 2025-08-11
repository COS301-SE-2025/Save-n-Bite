import React, { useState, useEffect } from 'react'
import AuditLogFilters from '../../components/SystemAdmin/Audit/AuditLogFilters'
import AuditLogTable from '../../components/SystemAdmin/Audit/AuditLogTable'
import AuditLogDetails from '../../components/SystemAdmin/Audit/AuditLogDetails'
import AdminAPI from '../../services/AdminAPI'
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
  
  
  /**
   * Fetch audit logs from backend or use mock data
   */
  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Real API call - this endpoint would need to be implemented
      const params = {
        page: currentPage,
        page_size: 20
      }

      if (search) params.search = search
      if (actionFilter !== 'All') params.action_type = actionFilter
      if (dateFilter !== 'All') params.date_filter = dateFilter

      // Note: This endpoint doesn't exist yet in your backend
      // You would need to implement it in your Django admin panel
      const response = await AdminAPI.getAdminActionLogs(params)

      if (response.success) {
        setLogs(response.data.logs || [])
        setTotalCount(response.data.pagination?.total_count || 0)
        setTotalPages(response.data.pagination?.total_pages || 1)
        setCurrentPage(response.data.pagination?.current_page || 1)
      } else {
        throw new Error(response.error || 'Failed to fetch audit logs')
      }

    } catch (err) {
      console.error('Audit logs fetch error:', err)
      setError(err.message)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle export functionality
   */
  const handleExport = async () => {
    try {
      const response = await AdminAPI.exportData('audit_logs', {
        search,
        action_filter: actionFilter,
        date_filter: dateFilter
      })

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
   * Load data on component mount and when filters change
   */
  useEffect(() => {
    fetchAuditLogs()
  }, [search, actionFilter, dateFilter, currentPage])

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  // Get unique action types for filter
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
              onClick={handleRefresh}
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
      
      {/* Demo Notice */}
      {useMockData && (
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
                Currently showing mock audit logs. Real audit log API needs to be implemented in the backend.
              </p>

            </div>
          </div>
        </div>
      )}

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

        </div>
      </div>
    </div>
  )
}

export default AuditLogs