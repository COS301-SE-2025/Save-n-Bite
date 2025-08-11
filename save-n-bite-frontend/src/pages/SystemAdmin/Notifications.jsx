import React, { useState, useEffect } from 'react'
import NotificationFilters from '../../components/SystemAdmin/Notifications/NotificationFilters'
import NotificationList from '../../components/SystemAdmin/Notifications/NotificationList'
import NotificationComposer from '../../components/SystemAdmin/Notifications/NotificationComposer'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'
import AdminAPI from '../../services/AdminAPI'

const Notifications = () => {
  // Backend integration state
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [audienceCounts, setAudienceCounts] = useState({})
  const [analytics, setAnalytics] = useState(null)
  const [sending, setSending] = useState(false)

  // UI state
  const [search, setSearch] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showComposer, setShowComposer] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState(null)

  // ==================== BACKEND INTEGRATION ====================

  /**
   * Load initial data when component mounts
   */
  useEffect(() => {
    loadInitialData()
  }, [])

  /**
   * Load all necessary data for the notifications page
   */
  const loadInitialData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load audience counts for composer
      const audienceResponse = await AdminAPI.getAudienceCounts()
      if (audienceResponse.success) {
        setAudienceCounts(audienceResponse.data.audience_counts || {})
      }

      // Load notification analytics
      const analyticsResponse = await AdminAPI.getNotificationAnalytics()
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data.analytics)
      }

      // Note: If you implement notification history endpoint, uncomment below:
      // const historyResponse = await AdminAPI.getNotificationHistory({ page: 1, page_size: 50 })
      // if (historyResponse.success) {
      //   setNotifications(transformBackendNotifications(historyResponse.data.results || []))
      // }

    } catch (err) {
      console.error('Error loading initial data:', err)
      setError('Failed to load notification data')
      toast.error('Failed to load notification data')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Transform backend notification data to match UI expectations
   * This function converts the backend notification format to the frontend format
   */
  const transformBackendNotifications = (backendNotifications) => {
    return backendNotifications.map(notification => ({
      id: notification.id,
      title: notification.subject || notification.title,
      message: notification.body || notification.message,
      audience: capitalizeFirstLetter(notification.target_audience || 'all'),
      type: notification.notification_type || 'system_announcement',
      sender: notification.sender?.name || 'Admin',
      date: new Date(notification.created_at).toISOString().split('T')[0],
      status: notification.status || 'Sent',
      readCount: notification.stats?.notifications_sent || 0,
      scheduledFor: notification.scheduled_for || null,
      emailsSent: notification.stats?.emails_sent || 0,
      emailsFailed: notification.stats?.emails_failed || 0
    }))
  }

  /**
   * Helper function to capitalize first letter
   */
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  /**
   * Send notification through backend
   */
  const handleSendNotification = async (notification) => {
    setSending(true)

    try {
      // Map frontend audience to backend format
      const audienceMapping = {
        'All': 'all',
        'Customers': 'customers',
        'Businesses': 'businesses',
        'NGOs': 'organisations'
      }

      const notificationData = {
        title: notification.title,
        message: notification.message,
        audience: audienceMapping[notification.audience] || 'all',
        type: notification.type
      }

      const response = await AdminAPI.sendCustomNotification(notificationData)

      if (response.success) {
        // Create a local notification object for immediate UI update
        const newNotification = {
          id: `local_${Date.now()}`, // Temporary ID
          title: notification.title,
          message: notification.message,
          audience: notification.audience,
          type: notification.type,
          sender: 'Admin',
          date: new Date().toISOString().split('T')[0],
          status: 'Sent',
          readCount: response.data.stats?.total_users || 0,
          emailsSent: response.data.stats?.emails_sent || 0,
          emailsFailed: response.data.stats?.emails_failed || 0,
          scheduledFor: null
        }

        // Add to local state for immediate feedback
        setNotifications(prev => [newNotification, ...prev])

        // Show success message with stats
        const stats = response.data.stats
        toast.success(
          `Notification sent successfully! Reached ${stats?.total_users || 0} users, ${stats?.emails_sent || 0} emails sent.`
        )

        // Refresh analytics
        const analyticsResponse = await AdminAPI.getNotificationAnalytics()
        if (analyticsResponse.success) {
          setAnalytics(analyticsResponse.data.analytics)
        }

      } else {
        toast.error(response.error || 'Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Failed to send notification')
    } finally {
      setSending(false)
      setShowComposer(false)
    }
  }

  /**
   * Handle scheduled notifications (if implementing scheduling)
   */
  const handleScheduleNotification = async (notification) => {
    // This would require backend support for scheduling
    // For now, we'll show a message that scheduling is not yet implemented
    toast.info('Notification scheduling will be implemented in a future update')
    setShowComposer(false)
  }

  /**
   * Handle canceling scheduled notifications
   */
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

  /**
   * Handle sending scheduled notifications immediately
   */
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
    toast.success('Scheduled notification sent immediately')
  }

  /**
   * Handle deleting notifications (if implemented on backend)
   */
  const handleDeleteNotification = (id) => {
    setNotificationToDelete(id)
    setShowConfirmModal(true)
  }

  const confirmDelete = () => {
    if (notificationToDelete) {
      // For now, just remove from local state
      // In a full implementation, you'd call a backend API to delete
      setNotifications(
        notifications.filter((n) => n.id !== notificationToDelete)
      )
      toast.success(`Notification has been deleted`)
      setNotificationToDelete(null)
      setShowConfirmModal(false)
    }
  }

  /**
   * Refresh data manually
   */
  const handleRefresh = () => {
    loadInitialData()
    toast.success('Data refreshed')
  }

  // ==================== UI FILTERING ====================

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

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error: {error}</div>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              Send and manage system-wide notifications
            </p>
            {analytics && (
              <div className="mt-2 text-sm text-gray-500">
                Total sent: {analytics.total_notifications_sent || 0} | 
                This month: {analytics.monthly_stats?.current_month || 0}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              onClick={() => setShowComposer(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Compose Notification'}
            </button>
          </div>
        </div>

        {/* Audience counts info */}
        {Object.keys(audienceCounts).length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-2xl font-bold text-blue-600">
                {audienceCounts.all || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">Customers</div>
              <div className="text-2xl font-bold text-green-600">
                {audienceCounts.customers || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">Businesses</div>
              <div className="text-2xl font-bold text-purple-600">
                {audienceCounts.businesses || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-sm text-gray-600">NGOs</div>
              <div className="text-2xl font-bold text-orange-600">
                {audienceCounts.organisations || 0}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <NotificationFilters
          search={search}
          setSearch={setSearch}
          audienceFilter={audienceFilter}
          setAudienceFilter={setAudienceFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Notifications List */}
        <NotificationList
          notifications={filteredNotifications}
          onDeleteNotification={handleDeleteNotification}
          onCancelScheduled={handleCancelScheduled}
          onSendScheduledNow={handleSendScheduledNow}
        />

        {/* Notification Composer Modal */}
        {showComposer && (
          <NotificationComposer
            onClose={() => setShowComposer(false)}
            onSendNotification={handleSendNotification}
            onScheduleNotification={handleScheduleNotification}
            audienceCounts={audienceCounts}
            isLoading={sending}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showConfirmModal && (
          <ConfirmationModal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            onConfirm={confirmDelete}
            title="Delete Notification"
            message="Are you sure you want to delete this notification? This action cannot be undone."
            confirmButtonText="Delete"
            cancelButtonText="Cancel"
          />
        )}
      </div>
    </div>
  )
}

export default Notifications