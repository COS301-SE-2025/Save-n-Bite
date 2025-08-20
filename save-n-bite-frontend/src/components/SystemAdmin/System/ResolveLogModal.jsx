import React, { useState } from 'react'
import {
  XIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon
} from 'lucide-react'

const ResolveLogModal = ({ log, onClose, onResolve, resolving }) => {
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [error, setError] = useState('')

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
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

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'info':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!resolutionNotes.trim()) {
      setError('Resolution notes are required')
      return
    }

    if (resolutionNotes.trim().length < 10) {
      setError('Resolution notes must be at least 10 characters long')
      return
    }

    onResolve(log.id, resolutionNotes.trim())
  }

  const handleCancel = () => {
    if (!resolving) {
      onClose()
    }
  }

  // Get the display severity - prioritize 'severity' field, fallback to level
  const displaySeverity = log.severity || log.level?.toLowerCase() || 'info'
  // Get the display title - prioritize 'title' field, fallback to message
  const displayTitle = log.title || log.message || 'System Log'
  // Get the display description
  const displayDescription = log.description || log.details || 'No description available'
  // Get the display category/service
  const displayCategory = log.category || log.service || 'unknown'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Resolve System Log
                    </h3>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={resolving}
                      className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Log Summary */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(displaySeverity)}`}
                      >
                        {getSeverityIcon(displaySeverity)}
                        <span className="ml-1 uppercase">{displaySeverity}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {displayTitle}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {displayDescription}
                    </p>
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500">Category:</span>
                      <span className="text-xs text-gray-700 ml-1 capitalize">{displayCategory}</span>
                    </div>
                  </div>

                  {/* Resolution Notes Input */}
                  <div className="mt-4">
                    <label htmlFor="resolutionNotes" className="block text-sm font-medium text-gray-700">
                      Resolution Notes <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 mb-2">
                      Describe how this issue was resolved or what actions were taken.
                    </p>
                    <textarea
                      id="resolutionNotes"
                      rows={4}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      disabled={resolving}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="e.g., Restarted the database service and confirmed connection is stable. Added monitoring to prevent future occurrences."
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-gray-500">
                        {resolutionNotes.length}/1000 characters
                      </div>
                      {resolutionNotes.length < 10 && resolutionNotes.length > 0 && (
                        <div className="text-xs text-red-500">
                          Minimum 10 characters required
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex">
                        <AlertCircleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex">
                      <AlertTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <strong>Note:</strong> Marking this log as resolved will change its status and record your resolution notes. This action cannot be undone.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={resolving || !resolutionNotes.trim() || resolutionNotes.trim().length < 10}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resolving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Mark as Resolved
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={resolving}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResolveLogModal