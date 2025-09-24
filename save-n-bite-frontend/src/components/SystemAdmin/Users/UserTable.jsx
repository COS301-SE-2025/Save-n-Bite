import React, { useState, useRef, useEffect } from 'react'
import {
  SearchIcon,
  FilterIcon,
  EyeIcon,
  XCircleIcon,
  KeyIcon,
  CheckIcon,
  AlertTriangleIcon,
  MoreVerticalIcon,
  UserPlusIcon,
  UserXIcon,
  MailIcon,
  ShieldIcon
} from 'lucide-react'
import InfoTooltip from '../UI/InfoTooltip'
import { useOnClickOutside } from '../../../hooks/useOnClickOutside'

const ActionMenu = ({ user, onActionClick, onClose }) => {
  const menuRef = useRef()
  
  // Close menu when clicking outside
  useOnClickOutside(menuRef, onClose)

  const actions = [
    {
      id: 'view',
      label: 'View Details',
      icon: <EyeIcon size={16} className="mr-2" />,
      onClick: () => onActionClick('view', user.id)
    },
    {
      id: user.status === 'Active' ? 'deactivate' : 'activate',
      label: user.status === 'Active' ? 'Deactivate User' : 'Activate User',
      icon: user.status === 'Active' ? 
        <XCircleIcon size={16} className="mr-2" /> : 
        <CheckIcon size={16} className="mr-2" />,
      onClick: () => onActionClick(user.status === 'Active' ? 'deactivate' : 'activate', user.id)
    },
    {
      id: 'resetPassword',
      label: 'Reset Password',
      icon: <KeyIcon size={16} className="mr-2" />,
      onClick: () => onActionClick('resetPassword', user.id)
    },
    {
      id: 'sendEmail',
      label: 'Send Message',
      icon: <MailIcon size={16} className="mr-2" />,
      onClick: () => onActionClick('sendEmail', user.id)
    },
    {
      id: 'permissions',
      label: 'Manage Permissions',
      icon: <ShieldIcon size={16} className="mr-2" />,
      onClick: () => onActionClick('permissions', user.id)
    }
  ]

  return (
    <div 
      ref={menuRef}
      className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
      aria-orientation="vertical"
      tabIndex="-1"
    >
      <div className="py-1" role="none">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={(e) => {
              e.preventDefault()
              action.onClick()
              onClose()
            }}
            className="text-gray-700 group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
            tabIndex="-1"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

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
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRefs = useRef({})

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openMenuId])

  const toggleMenu = (userId, event) => {
    event.stopPropagation()
    setOpenMenuId(openMenuId === userId ? null : userId)
  }

  const handleAction = (action, userId) => {
    setOpenMenuId(null)
    onActionClick(action, userId)
  }

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
                      <div className="flex justify-end space-x-2">
                        {/* Always show view button */}
                        <button
                          onClick={() => onViewUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View User"
                        >
                          <EyeIcon size={18} />
                        </button>

                        {/* Show action menu for 3+ actions */}
                        <div className="relative inline-block text-left" ref={el => menuRefs.current[user.id] = el}>
                          <button
                            type="button"
                            onClick={(e) => toggleMenu(user.id, e)}
                            className="text-gray-400 hover:text-gray-600"
                            aria-expanded={openMenuId === user.id}
                            aria-haspopup="true"
                            aria-label="More actions"
                          >
                            <MoreVerticalIcon size={18} />
                          </button>

                          {openMenuId === user.id && (
                            <ActionMenu 
                              user={user} 
                              onActionClick={handleAction}
                              onClose={() => setOpenMenuId(null)}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No {activeTab === 'Consumer' ? 'consumers' : activeTab === 'Provider' ? 'providers' : 'NGOs'} found matching your filters.
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
