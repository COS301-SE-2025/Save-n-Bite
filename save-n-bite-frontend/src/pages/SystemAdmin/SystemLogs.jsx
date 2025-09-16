// pages/SystemAdmin/SystemLogs.jsx - ENHANCED with Prac 2 Algorithm
import React, { useState, useEffect } from 'react'
import SystemLogFilters from '../../components/SystemAdmin/System/SystemLogFilters'
import SystemLogTable from '../../components/SystemAdmin/System/SystemLogTable'
import SystemLogDetails from '../../components/SystemAdmin/System/SystemLogDetails'
import ResolveLogModal from '../../components/SystemAdmin/System/ResolveLogModal'
import AnomalyDetectionCard from '../../components/SystemAdmin/System/AnomalyDetectionCard'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'
import { toast } from 'sonner'
import {
  AlertCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  RefreshCwIcon,
  DownloadIcon,
  ShieldAlertIcon
} from 'lucide-react'

const SystemLogs = () => {
  const [logs, setLogs] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [anomaliesLoading, setAnomaliesLoading] = useState(true)
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

  // Authentication setup
  useEffect(() => {
    setupAuthAndFetchData()
  }, [])

  const setupAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Load both system logs and anomalies
      await Promise.all([
        fetchSystemLogs(),
        fetchAnomalies()
      ])
      
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
      setLoading(false)
      setAnomaliesLoading(false)
    }
  }

  /**
   * Fetch system logs from API with proper field mapping
   */
  const fetchSystemLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Convert date filter to actual dates
      let startDate = ''
      let endDate = ''
      
      if (search.includes('today')) {
        startDate = new Date().toISOString().split('T')[0]
        endDate = startDate
      } else if (search.includes('week')) {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        startDate = weekAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      } else if (search.includes('month')) {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        startDate = monthAgo.toISOString().split('T')[0]
        endDate = new Date().toISOString().split('T')[0]
      }

      // Convert filters to match backend API expectations
      const severity = levelFilter === 'All' ? '' : levelFilter.toLowerCase()
      const status = statusFilter === 'All' ? '' : statusFilter.toLowerCase()
      const category = serviceFilter === 'All' ? '' : serviceFilter.toLowerCase()

      // Build query parameters for the API call
      const params = new URLSearchParams({
        page: (Number(currentPage) || 1).toString(),
        per_page: '20'
      })
      
      if (search) params.append('search', search)
      if (severity) params.append('severity', severity)
      if (status) params.append('status', status)
      if (category) params.append('category', category)
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      // Make API call
      const response = await apiClient.get(`/api/admin/logs/system/?${params.toString()}`)
      
      if (response.data.logs) {
        // Transform backend data to frontend format
        const transformedLogs = response.data.logs.map(log => ({
          id: log.id,
          level: (log.severity || 'info').toUpperCase(),
          message: log.title || log.description || 'No message',
          service: log.category || 'unknown',
          timestamp: log.timestamp,
          status: log.status || 'open',
          description: log.description,
          error_details: log.error_details,
          resolved_by_name: log.resolved_by_name,
          resolution_notes: log.resolution_notes,
          resolved_at: log.resolved_at,
          title: log.title,
          severity: log.severity,
          category: log.category,
          details: log.description,
          stack: log.error_details ? JSON.stringify(log.error_details, null, 2) : null,
          originalData: log
        }))
        
        setLogs(transformedLogs)
        setCurrentPage(Number(response.data.pagination.current_page) || 1)
        setTotalPages(Number(response.data.pagination.total_pages) || 1)
        setTotalCount(Number(response.data.pagination.total_count) || 0)
        setSummary(response.data.summary || { total_open: 0, total_critical: 0 })
      } else {
        setLogs([])
        setTotalCount(0)
        setSummary({ total_open: 0, total_critical: 0 })
      }
      
    } catch (err) {
      console.error('System logs fetch error:', err)
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch system logs')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch anomalies using the enhanced Prac 2 algorithm
   */
  const fetchAnomalies = async () => {
    try {
      setAnomaliesLoading(true)
      
      const response = await AdminAPI.getSecurityAnomalies()
      
      if (response.success) {
        setAnomalies(response.data.anomalies || [])
      } else {
        console.error('Failed to fetch anomalies:', response.error)
        setAnomalies([])
      }
      
    } catch (err) {
      console.error('Anomalies fetch error:', err)
      setAnomalies([])
    } finally {
      setAnomaliesLoading(false)
    }
  }

  /**
   * Resolve system log using correct AdminAPI method
   */
  const handleResolveLog = async (logId, resolutionNotes) => {
    try {
      setResolving(true)
      
      const response = await AdminAPI.resolveSystemLog(logId, resolutionNotes)
      
      if (response.success) {
        await fetchSystemLogs()
        setShowResolveModal(false)
        setSelectedLog(null)
        toast.success('System log resolved successfully')
      } else {
        throw new Error(response.error || 'Failed to resolve system log')
      }
      
    } catch (err) {
      console.error('Resolve log error:', err)
      toast.error('Failed to resolve system log: ' + err.message)
    } finally {
      setResolving(false)
    }
  }

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchSystemLogs()
    fetchAnomalies()
    toast.success('System logs refreshed')
  }

  /**
   * Handle retry when there's an error
   */
  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    await setupAuthAndFetchData()
  }

  /**
   * Load data when filters change
   */
  useEffect(() => {
    if (!loading) { // Only refetch if not in initial load
      fetchSystemLogs()
    }
  }, [search, levelFilter, serviceFilter, statusFilter, currentPage])

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const handleResolveClick = (log) => {
    setSelectedLog(log)
    setShowResolveModal(true)
  }

  // Get unique services for filter from current logs
  const services = ['All', ...Array.from(new Set(logs.map(log => log.service).filter(Boolean)))]

  if (loading && anomaliesLoading) {
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
            <div className="text-gray-500">Loading system logs and anomaly detection...</div>
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
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-500">Monitor system errors, warnings, and issues with enhanced anomaly detection ({totalCount} total logs)</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>

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
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <ShieldAlertIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Anomalies</p>
              <p className="text-2xl font-semibold text-gray-900">{anomalies.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Anomaly Detection Card */}
      <AnomalyDetectionCard anomalies={anomalies} />

      {/* Show message if no logs */}
      {logs.length === 0 && !loading && !error && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12">
          <div className="text-center">
            <InfoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No System Logs</h3>
            <p className="text-gray-500">
              No system logs found. This could mean your system is running smoothly or logs haven't been generated yet.
            </p>
          </div>
        </div>
      )}

      {/* Only show filters and table if we have logs */}
      {logs.length > 0 && (
        <>
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
                  onClick={() => setCurrentPage(Math.max(1, Number(currentPage) - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(Number(totalPages), Number(currentPage) + 1))}
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
                      onClick={() => setCurrentPage(Math.max(1, Number(currentPage) - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(Number(totalPages), Number(currentPage) + 1))}
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
        </>
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

      {/* Backend Connection Status */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="flex items-center text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full mr-2 ${!error ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {!error ? 'Connected to system log API with enhanced anomaly detection' : 'API connection failed'}
        </div>
      </div>
    </div>
  )
}

export default SystemLogs