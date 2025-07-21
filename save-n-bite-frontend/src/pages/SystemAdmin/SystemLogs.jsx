import React, { useState, useEffect } from 'react'
import SystemLogFilters from '../../components/SystemAdmin/System/SystemLogFilters'
import SystemLogTable from '../../components/SystemAdmin/System/SystemLogTable'
import SystemLogDetails from '../../components/SystemAdmin/System/SystemLogDetails'
import ResolveLogModal from '../../components/SystemAdmin/System/ResolveLogModal'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  RefreshCwIcon,
  DownloadIcon
} from 'lucide-react'

const SystemLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolving, setResolving] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('All')
  const [serviceFilter, setServiceFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState({ total_open: 0, total_critical: 0 })
  
  // Use mock data for demo
  const [useMockData, setUseMockData] = useState(true)

  // Mock data matching backend structure
  const mockSystemLogs = {
    logs: [
      {
        id: 'SYS001',
        severity: 'critical',
        category: 'database',
        title: 'Database Connection Timeout',
        description: 'Primary database connection failed after 30 seconds',
        error_details: 'Connection to primary database failed with timeout. Attempted reconnection 3 times. Switched to backup database.',
        status: 'open',
        timestamp: '2023-08-10T14:32:45Z',
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null
      },
      {
        id: 'SYS002',
        severity: 'warning',
        category: 'system',
        title: 'High Memory Usage Detected',
        description: 'System memory usage has exceeded 85% threshold',
        error_details: 'System memory usage at 87%. Consider scaling up resources if this persists.',
        status: 'open',
        timestamp: '2023-08-10T12:15:22Z',
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null
      },
      {
        id: 'SYS003',
        severity: 'info',
        category: 'backup',
        title: 'Scheduled Backup Completed',
        description: 'Daily database backup completed successfully',
        error_details: 'Daily database backup completed and stored in cloud storage. Backup size: 1.2GB',
        status: 'resolved',
        timestamp: '2023-08-10T03:00:11Z',
        resolved_by: {
          username: 'admin_user'
        },
        resolved_at: '2023-08-10T03:01:00Z',
        resolution_notes: 'Backup completed successfully - no action required'
      },
      {
        id: 'SYS004',
        severity: 'error',
        category: 'payment',
        title: 'Payment Gateway API Request Failed',
        description: 'Request to payment gateway API failed with status 503',
        error_details: 'Payment gateway API returned 503 Service Unavailable. Transaction ID: TRX004. User payment was not processed.',
        status: 'open',
        timestamp: '2023-08-09T16:45:33Z',
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null
      },
      {
        id: 'SYS005',
        severity: 'warning',
        category: 'database',
        title: 'Slow Query Detected',
        description: 'Database query execution time exceeded 2s threshold',
        error_details: 'Query: SELECT * FROM transactions WHERE status = "pending" AND created_at < "2023-08-01" took 2.5 seconds to execute.',
        status: 'resolved',
        timestamp: '2023-08-09T10:22:17Z',
        resolved_by: {
          username: 'admin_user'
        },
        resolved_at: '2023-08-09T11:00:00Z',
        resolution_notes: 'Added database index on (status, created_at) columns. Query now executes in 0.1s.'
      },
      {
        id: 'SYS006',
        severity: 'info',
        category: 'system',
        title: 'System Update Applied Successfully',
        description: 'System updated to version 2.3.5',
        error_details: 'Applied 5 security patches and 2 performance improvements. All services restarted successfully.',
        status: 'resolved',
        timestamp: '2023-08-08T02:15:09Z',
        resolved_by: {
          username: 'admin_user'
        },
        resolved_at: '2023-08-08T02:20:00Z',
        resolution_notes: 'System update completed successfully'
      },
      {
        id: 'SYS007',
        severity: 'error',
        category: 'notification',
        title: 'Email Notification Delivery Failed',
        description: 'Failed to deliver email notification to user',
        error_details: 'SMTP server returned error code 550 for user john@example.com. User may have invalid email address.',
        status: 'open',
        timestamp: '2023-08-07T14:32:45Z',
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null
      },
      {
        id: 'SYS008',
        severity: 'warning',
        category: 'api',
        title: 'API Rate Limit Approaching Threshold',
        description: 'External API usage at 85% of daily limit',
        error_details: 'Geocoding API usage at 85% of daily limit. Current usage: 8500/10000 requests.',
        status: 'open',
        timestamp: '2023-08-07T11:05:22Z',
        resolved_by: null,
        resolved_at: null,
        resolution_notes: null
      }
    ],
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_count: 8,
      has_next: false,
      has_previous: false
    },
    summary: {
      total_open: 5,
      total_critical: 1
    }
  }

  // Fetch system logs from API
  const fetchSystemLogs = async () => {
    if (useMockData) {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Apply filters to mock data
      let filteredLogs = mockSystemLogs.logs.filter(log => {
        const matchesSearch = search === '' || 
          log.title.toLowerCase().includes(search.toLowerCase()) ||
          log.description.toLowerCase().includes(search.toLowerCase()) ||
          log.error_details.toLowerCase().includes(search.toLowerCase())
        
        const matchesLevel = levelFilter === 'All' || log.severity === levelFilter.toLowerCase()
        const matchesService = serviceFilter === 'All' || log.category === serviceFilter.toLowerCase()
        const matchesStatus = statusFilter === 'All' || log.status === statusFilter.toLowerCase()
        
        return matchesSearch && matchesLevel && matchesService && matchesStatus
      })
      
      setLogs(filteredLogs)
      setTotalCount(filteredLogs.length)
      setTotalPages(1)
      setSummary(mockSystemLogs.summary)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20'
      })
      
      if (levelFilter !== 'All') params.append('severity', levelFilter.toLowerCase())
      if (statusFilter !== 'All') params.append('status', statusFilter.toLowerCase())
      if (serviceFilter !== 'All') params.append('category', serviceFilter.toLowerCase())
      
      const response = await fetch(`/api/admin_panel/logs/system/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch system logs')
      }
      
      const data = await response.json()
      setLogs(data.logs)
      setCurrentPage(data.pagination.current_page)
      setTotalPages(data.pagination.total_pages)
      setTotalCount(data.pagination.total_count)
      setSummary(data.summary)
      
    } catch (err) {
      console.error('System logs fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Resolve system log
  const handleResolveLog = async (logId, resolutionNotes) => {
    try {
      setResolving(true)
      
      if (useMockData) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Update mock data
        setLogs(prevLogs => 
          prevLogs.map(log => 
            log.id === logId 
              ? {
                  ...log,
                  status: 'resolved',
                  resolved_by: { username: 'admin_user' },
                  resolved_at: new Date().toISOString(),
                  resolution_notes: resolutionNotes
                }
              : log
          )
        )
        
        // Update summary
        setSummary(prev => ({
          ...prev,
          total_open: Math.max(0, prev.total_open - 1)
        }))
        
        setShowResolveModal(false)
        setSelectedLog(null)
        return
      }

      const response = await fetch('/api/admin_panel/logs/system/resolve/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          log_id: logId,
          resolution_notes: resolutionNotes
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to resolve system log')
      }
      
      // Refresh logs after successful resolution
      await fetchSystemLogs()
      setShowResolveModal(false)
      setSelectedLog(null)
      
    } catch (err) {
      console.error('Resolve log error:', err)
      setError('Failed to resolve system log: ' + err.message)
    } finally {
      setResolving(false)
    }
  }

  useEffect(() => {
    fetchSystemLogs()
  }, [search, levelFilter, serviceFilter, statusFilter, currentPage, useMockData])

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const handleResolveClick = (log) => {
    setSelectedLog(log)
    setShowResolveModal(true)
  }

  const handleRefresh = () => {
    fetchSystemLogs()
  }

  // Get unique services for filter
  const services = ['All', ...Array.from(new Set(logs.map(log => log.category)))]

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircleIcon className="w-5 h-5 text-red-600" />
      case 'error':
        return <AlertTriangleIcon className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-500" />
      default:
        return <InfoIcon className="w-5 h-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
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
            <div className="text-gray-500">Loading system logs...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading System Logs</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-500">Monitor system errors, warnings, and issues</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Data Source:</label>
            <select
              value={useMockData ? 'mock' : 'api'}
              onChange={(e) => setUseMockData(e.target.value === 'mock')}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="mock">Mock Data</option>
              <option value="api">Live API</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <DownloadIcon className="w-4 h-4 mr-2 inline" />
            Export
          </button>
        </div>
      </div>

      {/* Demo Notice */}
      {useMockData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Demo Mode - Mock Data</h3>
              <p className="text-sm text-blue-700 mt-1">
                Currently showing mock system logs with resolve functionality. Switch to "Live API" to use real backend data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Issues</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_open}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.total_critical}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {logs.filter(log => log.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <InfoIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Logs</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <SystemLogFilters
        search={search}
        setSearch={setSearch}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        services={services}
      />

      {/* System Logs Table */}
      <SystemLogTable 
        logs={logs} 
        onViewDetails={handleViewDetails}
        onResolve={handleResolveClick}
      />

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
        <SystemLogDetails 
          log={selectedLog} 
          onClose={() => setShowDetailsModal(false)}
          onResolve={() => {
            setShowDetailsModal(false)
            setShowResolveModal(true)
          }}
        />
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedLog && (
        <ResolveLogModal
          log={selectedLog}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolveLog}
          resolving={resolving}
        />
      )}
    </div>
  )
}

export default SystemLogs