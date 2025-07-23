import React, { useState } from 'react'
import NotificationFilters from '../../components/SystemAdmin/Notifications/NotificationFilters'
import NotificationList from '../../components/SystemAdmin/Notifications/NotificationList'
import NotificationComposer from '../../components/SystemAdmin/Notifications/NotificationComposer'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'

// Enhanced mock data with scheduled notifications
const mockNotifications = [
  {
    id: 'NOT001',
    title: 'System Maintenance',
    message:
      'The platform will be undergoing scheduled maintenance tonight from 2 AM to 4 AM UTC. Some features may be unavailable during this time.',
    audience: 'All Users',
    sender: 'System',
    date: '2023-08-10',
    status: 'Sent',
    readCount: 1245,
    type: 'maintenance',
    scheduledFor: null,
  },
  {
    id: 'NOT002',
    title: 'New Feature: Bulk Listings',
    message:
      'Food providers can now create multiple listings at once using our new bulk upload feature. Check it out in your dashboard!',
    audience: 'Providers',
    sender: 'Admin',
    date: '2023-08-08',
    status: 'Sent',
    readCount: 387,
    type: 'update',
    scheduledFor: null,
  },
  {
    id: 'NOT003',
    title: 'Weekly Platform Update',
    message:
      'This week we launched improved search functionality and faster loading times. Check out the latest updates in your app!',
    audience: 'All Users',
    sender: 'Admin',
    date: '2023-08-15',
    status: 'Scheduled',
    readCount: 0,
    type: 'update',
    scheduledFor: '2023-08-15T10:00:00',
  },
  {
    id: 'NOT004',
    title: 'Holiday Hours Reminder',
    message:
      'Many of our providers will have modified hours during the upcoming holiday. Please check listing details before planning pickups.',
    audience: 'Consumers',
    sender: 'Admin',
    date: '2023-08-20',
    status: 'Scheduled',
    readCount: 0,
    type: 'announcement',
    scheduledFor: '2023-08-20T08:00:00',
  },
  {
    id: 'NOT005',
    title: 'Verification Process Update',
    message:
      "We've streamlined our verification process for NGOs. You can now get verified faster with fewer document requirements.",
    audience: 'NGOs',
    sender: 'Admin',
    date: '2023-08-05',
    status: 'Sent',
    readCount: 98,
    type: 'announcement',
    scheduledFor: null,
  },
]

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [search, setSearch] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showComposer, setShowComposer] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState(null)

  // Enhanced filtering with status
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(search.toLowerCase()) ||
      notification.message.toLowerCase().includes(search.toLowerCase())
    const matchesAudience =
      audienceFilter === 'All' || notification.audience === audienceFilter
    const matchesStatus =
      statusFilter === 'All' || notification.status === statusFilter
    return matchesSearch && matchesAudience && matchesStatus
  })

  const handleDeleteNotification = (id) => {
    setNotificationToDelete(id)
    setShowConfirmModal(true)
  }

  const confirmDelete = () => {
    if (notificationToDelete) {
      setNotifications(
        notifications.filter((n) => n.id !== notificationToDelete)
      )
      toast.success(`Notification ${notificationToDelete} has been deleted`)
      setNotificationToDelete(null)
      setShowConfirmModal(false)
    }
  }

  const handleSendNotification = (notification) => {
    const newNotification = {
      id: `NOT${(notifications.length + 1).toString().padStart(3, '0')}`,
      title: notification.title,
      message: notification.message,
      audience: notification.audience,
      type: notification.type,
      sender: 'Admin',
      date: new Date().toISOString().split('T')[0],
      status: 'Sent',
      readCount: 0,
      scheduledFor: null,
    }
    setNotifications([newNotification, ...notifications])
    toast.success('Notification sent successfully')
    setShowComposer(false)
  }

  const handleScheduleNotification = (notification) => {
    const newNotification = {
      id: `NOT${(notifications.length + 1).toString().padStart(3, '0')}`,
      title: notification.title,
      message: notification.message,
      audience: notification.audience,
      type: notification.type,
      sender: 'Admin',
      date: new Date(notification.scheduledDateTime).toISOString().split('T')[0],
      status: 'Scheduled',
      readCount: 0,
      scheduledFor: notification.scheduledDateTime,
    }
    setNotifications([newNotification, ...notifications])
    
    const scheduledDate = new Date(notification.scheduledDateTime)
    toast.success(
      `Notification scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}`
    )
    setShowComposer(false)
  }

  const handleCancelScheduled = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, status: 'Cancelled' }
          : notification
      )
    )
    toast.success('Scheduled notification cancelled')
  }

  const handleSendScheduledNow = (id) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { 
              ...notification, 
              status: 'Sent',
              date: new Date().toISOString().split('T')[0],
              scheduledFor: null
            }
          : notification
      )
    )
    toast.success('Notification sent immediately')
  }

  // Statistics for scheduled notifications
  const scheduledCount = notifications.filter(n => n.status === 'Scheduled').length
  const sentCount = notifications.filter(n => n.status === 'Sent').length
  const totalReads = notifications.reduce((sum, n) => sum + n.readCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            Send and schedule notifications to platform users
          </p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Notification
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{sentCount}</div>
          <div className="text-sm text-blue-800">Sent Notifications</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-amber-600">{scheduledCount}</div>
          <div className="text-sm text-amber-800">Scheduled</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{totalReads.toLocaleString()}</div>
          <div className="text-sm text-green-800">Total Reads</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {sentCount > 0 ? Math.round((totalReads / sentCount) * 100) / 100 : 0}
          </div>
          <div className="text-sm text-purple-800">Avg. Reads per Notification</div>
        </div>
      </div>

      <NotificationFilters
        search={search}
        setSearch={setSearch}
        audienceFilter={audienceFilter}
        setAudienceFilter={setAudienceFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <NotificationList
        notifications={filteredNotifications}
        onDelete={handleDeleteNotification}
        onCancelScheduled={handleCancelScheduled}
        onSendNow={handleSendScheduledNow}
      />

      {showComposer && (
        <NotificationComposer
          onClose={() => setShowComposer(false)}
          onSend={handleSendNotification}
          onSchedule={handleScheduleNotification}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal
          title="Delete Notification"
          message="Are you sure you want to delete this notification? This action cannot be undone."
          confirmButtonText="Delete"
          confirmButtonColor="red"
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Notifications