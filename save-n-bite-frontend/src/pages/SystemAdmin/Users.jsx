import React, { useState } from 'react'
import UserTabs from '../../components/SystemAdmin/Users/UserTabs'
import UserModal from '../../components/SystemAdmin/Users/UserModal'
import UserTable from '../../components/SystemAdmin/Users/UserTable'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'

// Mock data for users
const mockUsers = [
  {
    id: 'USR001',
    name: 'John Smith',
    email: 'john@example.com',
    role: 'Consumer',
    status: 'Active',
    joined: '2023-05-12',
    suspicious: false,
  },
  {
    id: 'USR002',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'Consumer',
    status: 'Active',
    joined: '2023-06-18',
    suspicious: false,
  },
  {
    id: 'USR003',
    name: 'Fresh Harvest Market',
    email: 'contact@freshharvest.com',
    role: 'Provider',
    status: 'Active',
    joined: '2023-04-05',
    suspicious: false,
  },
  {
    id: 'USR004',
    name: 'Food Rescue NGO',
    email: 'info@foodrescue.org',
    role: 'NGO',
    status: 'Active',
    joined: '2023-03-22',
    suspicious: false,
  },
  {
    id: 'USR005',
    name: 'Green Grocers',
    email: 'support@greengroc.com',
    role: 'Provider',
    status: 'Inactive',
    joined: '2023-07-01',
    suspicious: false,
  },
  {
    id: 'USR006',
    name: 'Community Food Bank',
    email: 'help@communityfood.org',
    role: 'NGO',
    status: 'Active',
    joined: '2023-02-15',
    suspicious: false,
  },
  {
    id: 'USR007',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'Consumer',
    status: 'Active',
    joined: '2023-08-03',
    suspicious: true,
  },
  {
    id: 'USR008',
    name: 'Local Bakery',
    email: 'info@localbakery.com',
    role: 'Provider',
    status: 'Active',
    joined: '2023-01-30',
    suspicious: false,
  },
  {
    id: 'USR009',
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    role: 'Consumer',
    status: 'Inactive',
    joined: '2023-04-11',
    suspicious: false,
  },
  {
    id: 'USR010',
    name: 'Hunger Relief',
    email: 'contact@hungerrelief.org',
    role: 'NGO',
    status: 'Active',
    joined: '2023-03-05',
    suspicious: false,
  },
]

const Users = () => {
  const [users, setUsers] = useState(mockUsers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('Consumer')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  // Filter users based on selected tab, search text, and status filter
  const filteredUsers = users.filter((user) => {
    const matchesRole = user.role === activeTab
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter
    return matchesRole && matchesSearch && matchesStatus
  })

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleConfirmAction = (type, userId) => {
    setConfirmAction({
      type,
      userId,
    })
    setShowConfirmModal(true)
  }

  const executeAction = () => {
    if (!confirmAction) return
    const { type, userId } = confirmAction
    if (type === 'deactivate') {
      setUsers(
        users.map((user) =>
          user.id === userId
            ? {
                ...user,
                status: user.status === 'Active' ? 'Inactive' : 'Active',
              }
            : user,
        ),
      )
      toast.success(
        `User ${userId} has been ${
          users.find((u) => u.id === userId)?.status === 'Active'
            ? 'deactivated'
            : 'activated'
        }`,
      )
    } else if (type === 'resetPassword') {
      toast.success(`Password reset email sent to user ${userId}`)
    }
    setShowConfirmModal(false)
    setConfirmAction(null)
  }

  // Count users by role
  const userCounts = {
    Consumer: users.filter((user) => user.role === 'Consumer').length,
    Provider: users.filter((user) => user.role === 'Provider').length,
    NGO: users.filter((user) => user.role === 'NGO').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">Manage all platform users</p>
      </div>
      <UserTabs activeTab={activeTab} setActiveTab={setActiveTab} userCounts={userCounts} />
      <UserTable
        users={filteredUsers}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeTab={activeTab}
        onViewUser={handleViewUser}
        onActionClick={handleConfirmAction}
      />
      {showUserModal && selectedUser && (
        <UserModal user={selectedUser} onClose={() => setShowUserModal(false)} />
      )}
      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'deactivate'
              ? users.find((u) => u.id === confirmAction.userId)?.status === 'Active'
                ? 'Deactivate User'
                : 'Activate User'
              : 'Reset User Password'
          }
          message={
            confirmAction.type === 'deactivate'
              ? users.find((u) => u.id === confirmAction.userId)?.status === 'Active'
                ? 'Are you sure you want to deactivate this user? They will not be able to log in or use the platform until reactivated.'
                : 'Are you sure you want to reactivate this user? They will be able to log in and use the platform again.'
              : "Are you sure you want to reset this user's password? They will receive an email with instructions to set a new password."
          }
          confirmButtonText="Confirm"
          confirmButtonColor={
            confirmAction.type === 'deactivate'
              ? users.find((u) => u.id === confirmAction.userId)?.status === 'Active'
                ? 'red'
                : 'green'
              : 'blue'
          }
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Users
