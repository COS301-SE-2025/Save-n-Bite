import React from 'react'
import { XIcon, UserIcon, GlobeIcon, MonitorIcon } from 'lucide-react'

const AuditLogDetails = ({ log, onClose }) => {
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Audit Log Details
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Log ID</h4>
                    <p className="mt-1 text-sm text-gray-900">{log.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Action</h4>
                    <p className="mt-1 text-sm text-gray-900">{log.action}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Admin User
                      </h4>
                      <div className="mt-1 flex items-center">
                        <UserIcon size={16} className="text-gray-400 mr-1" />
                        <p className="text-sm text-gray-900">{log.user.name}</p>
                      </div>
                      <p className="text-xs text-gray-500">{log.user.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Target
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">{log.target.name}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {log.target.type}
                        </span>
                        <span className="ml-1">{log.target.id}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Timestamp</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Details</h4>
                    <div className="mt-1 bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-900">{log.details}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-gray-700">
                      Technical Information
                    </h4>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <GlobeIcon size={16} className="text-gray-400 mr-1" />
                        <span className="text-xs text-gray-600">
                          IP Address: {log.ip}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MonitorIcon size={16} className="text-gray-400 mr-1" />
                        <span className="text-xs text-gray-600">
                          User Agent: {log.userAgent}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuditLogDetails
