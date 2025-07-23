import React, { useState } from 'react'
import { toast } from 'sonner'
import { SaveIcon, DatabaseIcon, DownloadIcon, ClockIcon } from 'lucide-react'

const SystemSettings = () => {
  const [isExporting, setIsExporting] = useState(false)
  const [lastBackup, setLastBackup] = useState('Today at 3:00 AM')
  
  const handleDatabaseExport = async (format) => {
    setIsExporting(true)
    try {
      // Simulate API call for database export
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Database export (${format}) started.`)
    } catch (error) {
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleManualBackup = async () => {
    try {
      // Simulate API call for manual backup
      await new Promise(resolve => setTimeout(resolve, 1500))
      setLastBackup('Just now')
      toast.success('Manual backup completed successfully')
    } catch (error) {
      toast.error('Backup failed. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <DatabaseIcon className="h-6 w-6 text-gray-400 mr-3" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">Database Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage database operations, backups, and data exports.
          </p>
        </div>
      </div>

      {/* Database Backup Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h4 className="text-base font-medium text-gray-900">Database Backup</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-md border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Last Backup</p>
                <p className="text-xs text-gray-500">{lastBackup}</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-md border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Next Scheduled</p>
                <p className="text-xs text-gray-500">Tomorrow at 3:00 AM</p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Scheduled
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleManualBackup}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DatabaseIcon className="mr-2 h-4 w-4" />
            Run Manual Backup
          </button>
          
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View Backup History
          </button>
        </div>
      </div>

      {/* Database Export Section */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <div className="flex items-center mb-4">
          <DownloadIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h4 className="text-base font-medium text-gray-900">Data Export</h4>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Export system data for analysis, reporting, or migration purposes. 
        </p>
// I may export in other formats but as far as i know, it's just CSV
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { format: 'CSV', desc: 'Comma-separated values for spreadsheets' }
          ].map((exportOption) => (
            <div key={exportOption.format} className="bg-white p-4 rounded-md border border-blue-200">
              <h5 className="font-medium text-gray-900 mb-2">{exportOption.format}</h5>
              <p className="text-xs text-gray-500 mb-3">{exportOption.desc}</p>
              <button
                type="button"
                onClick={() => handleDatabaseExport(exportOption.format)}
                disabled={isExporting}
                className="w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <DownloadIcon className="mr-1 h-4 w-4" />
                    Export
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Large exports may take several minutes to process. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings