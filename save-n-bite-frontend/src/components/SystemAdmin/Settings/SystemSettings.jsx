import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminAPI from '../../../services/AdminAPI'
import { apiClient } from '../../../services/FoodAPI.js'
import { SaveIcon, DatabaseIcon, DownloadIcon, ClockIcon, AlertCircleIcon } from 'lucide-react'

const SystemSettings = () => {
  const [isExporting, setIsExporting] = useState(false)
  const [lastBackup, setLastBackup] = useState('Today at 3:00 AM')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exportProgress, setExportProgress] = useState({})

  // Authentication setup
  useEffect(() => {
    setupAuth()
  }, [])

  const setupAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
    }
  }

  /**
   * Handle data export for different data types
   */
  const handleDataExport = async (exportType, format = 'csv') => {
    if (exportProgress[exportType]) {
      toast.warning(`${exportType} export already in progress`)
      return
    }

    setExportProgress(prev => ({ ...prev, [exportType]: true }))
    
    try {
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const dateFrom = thirtyDaysAgo.toISOString().split('T')[0]
      const dateTo = today.toISOString().split('T')[0]

      console.log(`Exporting ${exportType} data from ${dateFrom} to ${dateTo}`)

      const response = await AdminAPI.exportData(exportType, dateFrom, dateTo)

      if (response.success) {
        // Create download link for the exported file
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.${format}`
        link.click()
        window.URL.revokeObjectURL(url)
        
        toast.success(`${exportType.charAt(0).toUpperCase() + exportType.slice(1)} data exported successfully`)
      } else {
        throw new Error(response.error || 'Export failed')
      }
    } catch (error) {
      console.error(`Export error for ${exportType}:`, error)
      toast.error(`Failed to export ${exportType} data: ${error.message}`)
    } finally {
      setExportProgress(prev => ({ ...prev, [exportType]: false }))
    }
  }

  /**
   * Handle full database export (all data types)
   */
  const handleFullDatabaseExport = async () => {
    setIsExporting(true)
    
    try {
      // Export all available data types from the backend serializer
      const exportTypes = ['users', 'analytics', 'audit_logs', 'system_logs', 'transactions', 'listings']
      
      // Export each type sequentially to avoid overwhelming the server
      for (const type of exportTypes) {
        try {
          await handleDataExport(type)
          // Small delay between exports to prevent server overload
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          console.error(`Failed to export ${type}:`, error)
          // Continue with other exports even if one fails
        }
      }
      
      toast.success('Full database export completed successfully')
    } catch (error) {
      console.error('Full export error:', error)
      toast.error('Some exports may have failed. Check individual downloads.')
    } finally {
      setIsExporting(false)
    }
  }
  /**
   * All export types available in the backend serializer
   */
  const exportTypes = [
    {
      type: 'users',
      name: 'Users Data',
      description: 'All user accounts, profiles, and activity data',
      icon: '👥',
      category: 'User Management'
    },
    {
      type: 'analytics',
      name: 'Analytics Data',
      description: 'System metrics, statistics, and performance data',
      icon: '📊',
      category: 'Performance'
    },
    {
      type: 'audit_logs',
      name: 'Audit Logs',
      description: 'Admin action logs and system access records',
      icon: '📋',
      category: 'Security & Compliance'
    },
    {
      type: 'system_logs',
      name: 'System Logs',
      description: 'Error logs, warnings, and system events',
      icon: '⚠️',
      category: 'System Health'
    },
    {
      type: 'transactions',
      name: 'Transactions',
      description: 'Payment records, interactions, and financial data',
      icon: '💳',
      category: 'Financial'
    },
    {
      type: 'listings',
      name: 'Food Listings',
      description: 'All food listings, provider data, and listing activity',
      icon: '🍕',
      category: 'Content Management'
    }
  ]

  // Group export types by category for better organization
  const exportsByCategory = exportTypes.reduce((acc, exportType) => {
    const category = exportType.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(exportType)
    return acc
  }, {})

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <DatabaseIcon className="h-6 w-6 text-gray-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
            <p className="mt-1 text-sm text-gray-500">Database management and data export tools.</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={setupAuth}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <DatabaseIcon className="h-6 w-6 text-gray-400 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage database operations, backups, and data exports.
          </p>
        </div>
      </div>

      {/* Individual Data Export Section - Organized by Category */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <DownloadIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h4 className="text-base font-medium text-gray-900">Individual Data Export</h4>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Export specific data types for analysis, reporting, or compliance purposes. Data from the last 30 days will be included.
        </p>

        {Object.entries(exportsByCategory).map(([category, categoryTypes]) => (
          <div key={category} className="mb-6 last:mb-0">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              {category}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryTypes.map((exportType) => (
                <div key={exportType.type} className="bg-white p-4 rounded-md border border-blue-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{exportType.icon}</span>
                    <h6 className="font-medium text-gray-900 text-sm">{exportType.name}</h6>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{exportType.description}</p>
                  <button
                    type="button"
                    onClick={() => handleDataExport(exportType.type)}
                    disabled={exportProgress[exportType.type]}
                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {exportProgress[exportType.type] ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <DownloadIcon className="mr-1 h-4 w-4" />
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Full Database Export Section */}
      <div className="bg-green-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <DatabaseIcon className="h-5 w-5 text-green-500 mr-2" />
          <h4 className="text-base font-medium text-gray-900">Full Database Export</h4>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Export all system data at once. This will download multiple CSV files containing all 6 data types: 
          <span className="font-medium"> Users, Analytics, Audit Logs, System Logs, Transactions, and Listings</span>.
        </p>

        <div className="bg-white p-4 rounded-md border border-green-200 mb-4">
          <p className="text-sm text-green-700">
            <strong>Export includes:</strong> {exportTypes.map(t => t.name).join(', ')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleFullDatabaseExport}
          disabled={isExporting}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting All Data... ({exportTypes.length} files)
            </>
          ) : (
            <>
              <DownloadIcon className="mr-2 h-5 w-5" />
              Export Full Database ({exportTypes.length} files)
            </>
          )}
        </button>
      </div>

      {/* Export Statistics */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="text-base font-medium text-gray-900 mb-3">Export Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <p className="font-medium text-gray-900">Available Types</p>
            <p className="text-gray-600">{exportTypes.length} data categories</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="font-medium text-gray-900">Date Range</p>
            <p className="text-gray-600">Last 30 days</p>
          </div>
          <div className="bg-white p-3 rounded border">
            <p className="font-medium text-gray-900">Format</p>
            <p className="text-gray-600">CSV files</p>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> Large exports may take several minutes to process. 
              Exported data includes sensitive information - handle with care and follow your organization's data privacy policies.
              Full database exports will download {exportTypes.length} separate CSV files.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Connection Status */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="flex items-center text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full mr-2 ${!error ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {!error ? 'Connected to admin API' : 'API connection failed'}
        </div>
      </div>
    </div>
  )
}

export default SystemSettings