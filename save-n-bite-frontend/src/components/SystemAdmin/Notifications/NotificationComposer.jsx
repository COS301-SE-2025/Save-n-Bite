// Updated NotificationComposer.jsx - REMOVED SCHEDULING FEATURE

import React, { useState } from 'react'
import { XIcon, UsersIcon, SendIcon } from 'lucide-react'

const NotificationComposer = ({ 
  onClose, 
  onSendNotification,
  audienceCounts = {},
  isLoading = false 
}) => {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    audience: 'All',
    type: 'system_announcement'
  })

  const [errors, setErrors] = useState({})

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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    // Always send immediately (no scheduling option)
    onSendNotification(notification)
  }

  const getAudienceCount = (audience) => {
    const countMap = {
      'All': audienceCounts.all || 0,
      'Customers': audienceCounts.customers || 0,
      'Businesses': audienceCounts.businesses || 0,
      'NGOs': audienceCounts.organisations || 0
    }
    return countMap[audience] || 0
  }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Send Notification</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {notificationTypes.map((type) => (
                <label
                  key={type.value}
                  className={`relative flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
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
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={notification.title}
              onChange={(e) => setNotification({ ...notification, title: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              id="message"
              value={notification.message}
              onChange={(e) => setNotification({ ...notification, message: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <span className="text-2xl mr-3">{option.icon}</span>
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
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <div className="bg-white rounded border p-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-900">
                    {notification.title || 'Notification Title'}
                  </h5>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message || 'Your notification message will appear here...'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      To: {notification.audience} ({getAudienceCount(notification.audience).toLocaleString()} users)
                    </span>
                    <span className="text-xs text-gray-500">Now</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !notification.title.trim() || !notification.message.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
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
  )
}

export default NotificationComposer