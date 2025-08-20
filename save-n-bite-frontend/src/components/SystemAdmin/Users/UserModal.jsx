import React from 'react'
import { XIcon, AlertTriangleIcon } from 'lucide-react'

const UserModal = ({ user, onClose }) => {
  // Guard clause: if user is missing, don't render the modal
  if (!user) return null

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
                    User Details
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                    aria-label="Close modal"
                  >
                    <XIcon size={20} />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">User ID</h4>
                    <p className="mt-1 text-sm text-gray-900">{user.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                    <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Role</h4>
                    <p className="mt-1 text-sm text-gray-900">{user.role}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <p className="mt-1 text-sm text-gray-900">{user.status}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Joined Date</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(user.joined).toLocaleDateString()}
                    </p>
                  </div>

                  {user.suspicious && (
                    <div className="bg-red-50 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertTriangleIcon
                            className="h-5 w-5 text-red-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Suspicious Activity Detected
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>
                              This user has shown unusual activity patterns that may indicate fraudulent behavior. Consider investigating further or contacting the user.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

export default UserModal
