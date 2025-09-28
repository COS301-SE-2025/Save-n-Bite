import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminAPI from '../../services/AdminAPI'
import { XIcon, UsersIcon, SendIcon, BuildingIcon, HeartIcon } from 'lucide-react'

const Notifications = () => {
  // Backend integration state
  const [audienceCounts, setAudienceCounts] = useState({})
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Notification form state
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    audience: 'All',
    type: 'system_announcement'
  })

  const [errors, setErrors] = useState({})

  // ==================== BACKEND INTEGRATION ====================

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)

    try {
      // Load audience counts
      const audienceResponse = await AdminAPI.getAudienceCounts()
      if (audienceResponse.success) {
        setAudienceCounts(audienceResponse.data.audience_counts || {})
      }

      // Load notification analytics
      const analyticsResponse = await AdminAPI.getNotificationAnalytics()
      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data.analytics)
      }

    } catch (err) {
      console.error('Error loading initial data:', err)
      toast.error('Failed to load notification data')
    } finally {
      setLoading(false)
    }
  }

  // ==================== FORM VALIDATION ====================

  const validateForm = () => {
    const newErrors = {}
    
    if (!notification.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (notification.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }
    
    if (!notification.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (notification.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ==================== NOTIFICATION SENDING ====================

  const handleSendNotification = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setSending(true)

    try {
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
        const stats = response.data.stats
        toast.success(
          `Notification sent successfully! Reached ${stats?.total_users || 0} users, ${stats?.emails_sent || 0} emails sent.`
        )

        // Reset form
        setNotification({
          title: '',
          message: '',
          audience: 'All',
          type: 'system_announcement'
        })

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
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  const getAudienceCount = (audience) => {
    const countMap = {
      'All': audienceCounts.all || 0,
      'Customers': audienceCounts.customers || 0,
      'Businesses': audienceCounts.businesses || 0,
      'NGOs': audienceCounts.organisations || 0
    }
    return countMap[audience] || 0
  }

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'All':
        return <UsersIcon className="w-5 h-5" />
      case 'Customers':
        return <UsersIcon className="w-5 h-5" />
      case 'Businesses':
        return <BuildingIcon className="w-5 h-5" />
      case 'NGOs':
        return <HeartIcon className="w-5 h-5" />
      default:
        return <UsersIcon className="w-5 h-5" />
    }
  }

  // ==================== FORM DATA ====================

  const audienceOptions = [
    { value: 'All', label: 'All Users' },
    { value: 'Customers', label: 'Customers'},
    { value: 'Businesses', label: 'Businesses'},
    { value: 'NGOs', label: 'NGOs'}
  ]

  const notificationTypes = [
    { value: 'system_announcement', label: 'System Announcement', color: 'blue' },
    { value: 'platform_update', label: 'Platform Update', color: 'green' },
    { value: 'maintenance', label: 'Maintenance Notice', color: 'yellow' },
    { value: 'important_alert', label: 'Important Alert', color: 'red' }
  ]

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Send Notification</h1>
          <p className="text-gray-600 mt-2">
            Send system-wide notifications to your users
          </p>
          {analytics && (
            <div className="mt-2 text-sm text-gray-500">
              Total sent: {analytics.total_notifications_sent || 0} | 
              This month: {analytics.monthly_stats?.current_month || 0}
            </div>
          )}
        </div>

        {/* Audience counts info */}
        {Object.keys(audienceCounts).length > 0 && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <UsersIcon className="w-5 h-5 text-blue-600 mr-2" />
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {audienceCounts.all || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <UsersIcon className="w-5 h-5 text-green-600 mr-2" />
                <div className="text-sm text-gray-600">Customers</div>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {audienceCounts.customers || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <BuildingIcon className="w-5 h-5 text-purple-600 mr-2" />
                <div className="text-sm text-gray-600">Businesses</div>
              </div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {audienceCounts.businesses || 0}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex items-center">
                <HeartIcon className="w-5 h-5 text-orange-600 mr-2" />
                <div className="text-sm text-gray-600">NGOs</div>
              </div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                {audienceCounts.organisations || 0}
              </div>
            </div>
          </div>
        )}

        {/* Main Notification Form */}
        <div className="bg-white rounded-lg shadow-lg">
          <form onSubmit={handleSendNotification} className="p-8 space-y-6">
            
            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Notification Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {notificationTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      notification.type === type.value
                        ? `border-${type.color}-500 bg-${type.color}-50`
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={notification.type === type.value}
                      onChange={(e) => setNotification({ ...notification, type: e.target.value })}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {type.label}
                      </span>
                    </div>
                    {notification.type === type.value && (
                      <div className={`w-4 h-4 bg-${type.color}-500 rounded-full`} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter notification title..."
                maxLength={255}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                {notification.title.length}/255 characters
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                value={notification.message}
                onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                rows={5}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your message..."
                maxLength={2000}
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
              <div className="mt-1 text-xs text-gray-500">
                {notification.message.length}/2000 characters
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Audience
              </label>
              <div className="space-y-3">
                {audienceOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      notification.audience === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value={option.value}
                      checked={notification.audience === option.value}
                      onChange={(e) => setNotification({ ...notification, audience: e.target.value })}
                      className="sr-only"
                    />
                    <div className="flex items-center flex-1">
                      <div className="mr-3 text-gray-600">
                        {getAudienceIcon(option.value)}
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {option.label}
                        </span>
                        <div className="text-xs text-gray-500">
                          {getAudienceCount(option.value).toLocaleString()} users
                        </div>
                      </div>
                    </div>
                    {notification.audience === option.value && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <UsersIcon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-base font-medium text-gray-900">
                      {notification.title || 'Notification Title'}
                    </h5>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message || 'Your notification message will appear here...'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        To: {notification.audience} ({getAudienceCount(notification.audience).toLocaleString()} users)
                      </span>
                      <span className="text-xs text-gray-500">Now</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={sending || !notification.title.trim() || !notification.message.trim()}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="w-4 h-4 mr-2" />
                    Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Notifications