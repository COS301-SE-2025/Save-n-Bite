import React, { useState, useEffect } from 'react'
import AuditLogFilters from '../../components/SystemAdmin/Audit/AuditLogFilters'
import AuditLogTable from '../../components/SystemAdmin/Audit/AuditLogTable'
import AuditLogDetails from '../../components/SystemAdmin/Audit/AuditLogDetails'
import {
  AlertCircleIcon,
  RefreshCwIcon,
  DownloadIcon
} from 'lucide-react'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('All')
  const [adminFilter, setAdminFilter] = useState('All')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Use mock data for demo purposes
  const [useMockData, setUseMockData] = useState(true)

  // Mock data matching backend structure
  const mockAuditLogs = {
    logs: [
      {
        id: 'LOG001',
        action_type: 'user_management',
        action_description: 'Deactivated user account due to suspicious activity',
        admin_user: {
          username: 'admin_user',
          email: 'admin@savenbite.com'
        },
        target_type: 'user',
        target_id: 'USR007',
        timestamp: '2023-08-10T14:32:45Z',
        ip_address: '192.168.1.1',
        metadata: {
          target_name: 'Alex Johnson',
          reason: 'Suspicious activity detected'
        }
      },
      {
        id: 'LOG002',
        action_type: 'user_verification',
        action_description: 'Approved NGO verification request after document review',
        admin_user: {
          username: 'admin_user',
          email: 'admin@savenbite.com'
        },
        target_type: 'ngo_profile',
        target_id: 'NGO010',
        timestamp: '2023-08-09T11:15:22Z',
        ip_address: '192.168.1.1',
        metadata: {
          target_name: 'Hunger Relief Organization',
          previous_status: 'pending_verification',
          new_status: 'verified'
        }
      },
      {
        id: 'LOG003',
        action_type: 'listing_moderation',
        action_description: 'Removed listing due to food safety concerns',
        admin_user: {
          username: 'admin_user',
          email: 'admin@savenbite.com'
        },
        target_type: 'listing',
        target_id: 'LST004',
        timestamp: '2023-08-08T09:45:11Z',
        ip_address: '192.168.1.1',
        metadata: {
          target_name: 'Prepared Meals - 5 Pack',
          reason: 'Food safety concerns reported'
        }
      },
      {
        id: 'LOG004',
        action_type: 'system_announcement',
        action_description: 'Created system maintenance notification',
        admin_user: {
          username: 'admin_user',
          email: 'admin@savenbite.com'
        },
        target_type: 'announcement',
        target_id: 'ANN001',
        timestamp: '2023-08-07T16:20:33Z',
        ip_address: '192.168.1.1',
        metadata: {
          target_name: 'System Maintenance Notification',
          audience: 'all_users'
        }
      },
      {
        id: 'LOG005',
        action_type: 'data_export',
        action_description: 'Exported user data for compliance audit',
        admin_user: {
          username: 'admin_user',
          email: 'admin@savenbite.com'
        },
        target_type: 'users',
        target_id: 'EXPORT001',
        timestamp: '2023-08-06T10:05:17Z',
        ip_address: '192.168.1.1',
        metadata: {
          export_type: 'users',
          date_range: '2023-07-01 to 2023-08-01',
          record_count: 1247
        }
      },
      {
        id: 'LOG006',
        action_type: 'password_reset',
        action_description: 'Reset password for user upon request',
        admin_user: {
          username: 'admin_user',
          email: 'admin@savenbite.com'
        },
        target_type: 'user',
        target_id: 'USR123',
        timestamp: '2023-08-05T14:12:09Z',
        ip_address: '192.168.1.1',
        metadata: {
          target_name: 'John Smith',
          reason: 'User forgot password - identity verified'
        }
      }
    ],
    pagination: {
      current_page: 1,
      total_pages: 1,
      total_count: 6,
      has_next: false,
      has_previous: false
    }
  }

  // Fetch audit logs from API
  const fetchAuditLogs = async () => {
    if (useMockData) {
      // Simulate API delay
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Apply filters to mock data
      let filteredLogs = mockAuditLogs.logs.filter(log => {
        const matchesSearch = search === '' || 
          log.action_description.toLowerCase().includes(search.toLowerCase()) ||
          log.admin_user.username.toLowerCase().includes(search.toLowerCase()) ||
          (log.metadata.target_name && log.metadata.target_name.toLowerCase().includes(search.toLowerCase()))
        
        const matchesAction = actionFilter === 'All' || log.action_type === actionFilter
        
        return matchesSearch && matchesAction
      })
      
      setLogs(filteredLogs)
      setTotalCount(filteredLogs.length)
      setTotalPages(1)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '20'
      })
      
      if (search) params.append('search', search)
      if (actionFilter !== 'All') params.append('action_type', actionFilter)
      if (adminFilter !== 'All') params.append('admin_user', adminFilter)
      
      const response = await fetch(`/api/admin_panel/logs/admin-actions/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      
      const data = await response.json()
      setLogs(data.logs)
      setCurrentPage(data.pagination.current_page)
      setTotalPages(data.pagination.total_pages)
      setTotalCount(data.pagination.total_count)
      
    } catch (err) {
      console.error('Audit logs fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Export audit logs
  const handleExportLogs = async () => {
    try {
      const response = await fetch('/api/admin_panel/export/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          export_type: 'audit_logs',
          format: 'csv'
        })
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error('Export error:', err)
      setError('Failed to export audit logs')
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [search, actionFilter, dateFilter, adminFilter, currentPage, useMockData])

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const handleRefresh = () => {
    fetchAuditLogs()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
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
          <p className="text-gray-500">Track all admin actions and system changes</p>
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
          <button
            onClick={handleExportLogs}
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
            <AlertCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Demo Mode - Mock Data</h3>
              <p className="text-sm text-blue-700 mt-1">
                Currently showing mock audit logs. Switch to "Live API" to use real backend data.
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
        adminFilter={adminFilter}
        setAdminFilter={setAdminFilter}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <AlertCircleIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Actions</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <AlertCircleIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp).toDateString()
                  const today = new Date().toDateString()
                  return logDate === today
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <AlertCircleIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">
                {logs.filter(log => {
                  const logDate = new Date(log.timestamp)
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return logDate >= weekAgo
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  )
}

export default AuditLogs