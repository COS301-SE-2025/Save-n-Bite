import React, { useState } from 'react'
import NotificationFilters from '../../components/SystemAdmin/Notifications/NotificationFilters'
import NotificationList from '../../components/SystemAdmin/Notifications/NotificationList'
import NotificationComposer from '../../components/SystemAdmin/Notifications/NotificationComposer'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'

// Mock data for notifications
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
  },
  {
    id: 'NOT003',
    title: 'Verification Process Update',
    message:
      "We've streamlined our verification process for NGOs. You can now get verified faster with fewer document requirements.",
    audience: 'NGOs',
    sender: 'Admin',
    date: '2023-08-05',
    status: 'Sent',
    readCount: 98,
  },
  {
    id: 'NOT004',
    title: 'Holiday Hours',
    message:
      'Many of our providers will have modified hours during the upcoming holiday. Please check listing details before planning pickups.',
    audience: 'Consumers',
    sender: 'Admin',
    date: '2023-08-01',
    status: 'Sent',
    readCount: 732,
  },
  {
    id: 'NOT005',
    title: 'Platform Update v2.3',
    message:
      "We've just released version 2.3 with improved search functionality and faster loading times. Refresh your browser to get the latest version.",
    audience: 'All Users',
    sender: 'System',
    date: '2023-07-28',
    status: 'Sent',
    readCount: 1876,
  },
]

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [search, setSearch] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('All')
  const [showComposer, setShowComposer] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState(null)

  // Filter notifications based on search and audience
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(search.toLowerCase()) ||
      notification.message.toLowerCase().includes(search.toLowerCase())
    const matchesAudience =
      audienceFilter === 'All' || notification.audience === audienceFilter
    return matchesSearch && matchesAudience
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
      sender: 'Admin',
      date: new Date().toISOString().split('T')[0],
      status: 'Sent',
      readCount: 0,
    }
    setNotifications([newNotification, ...notifications])
    toast.success('Notification sent successfully')
    setShowComposer(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => setShowComposer(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Notification
          </button>
        </div>
      </div>
      <NotificationFilters
        search={search}
        setSearch={setSearch}
        audienceFilter={audienceFilter}
        setAudienceFilter={setAudienceFilter}
      />
      <NotificationList
        notifications={filteredNotifications}
        onDelete={handleDeleteNotification}
      />
      {showComposer && (
        <NotificationComposer
          onClose={() => setShowComposer(false)}
          onSend={handleSendNotification}
        />
      )}
      {showConfirmModal && (
        <ConfirmationModal
          title="Delete Notification"
          message="Are you sure you want to delete this notification? This action cannot be undone."
          confirmButtonText="Delete"
          confirmButtonColor="red"
          onConfirm={confirmDelete}
          onCancel={() => {
            setNotificationToDelete(null)
            setShowConfirmModal(false)
          }}
        />
      )}
    </div>
  )
}

export default Notifications
