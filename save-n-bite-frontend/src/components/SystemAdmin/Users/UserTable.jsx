import React from 'react'
import {
  SearchIcon,
  FilterIcon,
  EyeIcon,
  XCircleIcon,
  KeyIcon,
  CheckIcon,
  AlertTriangleIcon,
} from 'lucide-react'
import InfoTooltip from '../UI/InfoTooltip'

const UserTable = ({
  users,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  activeTab,
  onViewUser,
  onActionClick,
}) => {
  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Search ${
                  activeTab === 'Consumer'
                    ? 'consumers'
                    : activeTab === 'Provider'
                    ? 'providers'
                    : 'NGOs'
                } by name, email, or ID...`}
              />
            </div>
          </div>
          <div className="relative inline-flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon size={18} className="text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center"
                >
                  Status
                  <span className="ml-1">
                    <InfoTooltip content="Active users can log in and use the platform. Inactive users are temporarily blocked." />
                  </span>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-0">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {user.name}
                            {user.suspicious && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangleIcon size={12} className="mr-1" />
                                Suspicious
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => onViewUser(user)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="View User"
                      >
                        <EyeIcon size={18} />
                      </button>
                      <button
                        onClick={() => onActionClick('deactivate', user.id)}
                        className={`${
                          user.status === 'Active'
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        } mr-4`}
                        title={
                          user.status === 'Active'
                            ? 'Deactivate User'
                            : 'Activate User'
                        }
                      >
                        {user.status === 'Active' ? (
                          <XCircleIcon size={18} />
                        ) : (
                          <CheckIcon size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => onActionClick('resetPassword', user.id)}
                        className="text-amber-600 hover:text-amber-900"
                        title="Reset Password"
                      >
                        <KeyIcon size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No{' '}
                    {activeTab === 'Consumer'
                      ? 'consumers'
                      : activeTab === 'Provider'
                      ? 'providers'
                      : 'NGOs'}{' '}
                    found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default UserTable
