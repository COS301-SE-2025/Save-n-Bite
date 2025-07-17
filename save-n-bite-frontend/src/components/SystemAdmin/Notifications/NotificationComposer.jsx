import React, { useState } from 'react'
import {
  XIcon,
  SendIcon,
  CalendarIcon,
  AlertCircleIcon,
  InfoIcon,
  LightbulbIcon,
  ClockIcon,
} from 'lucide-react'

const NotificationComposer = ({ onClose, onSend, onSchedule }) => {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')
  const [notificationType, setNotificationType] = useState('announcement')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const notificationTypes = [
    {
      key: 'announcement',
      label: 'Announcement',
      icon: InfoIcon,
      color: 'green',
      description: 'General announcements and updates'
    },
    {
      key: 'update',
      label: 'Platform Update',
      icon: LightbulbIcon,
      color: 'blue',
      description: 'New features and improvements'
    },
    {
      key: 'maintenance',
      label: 'Maintenance',
      icon: AlertCircleIcon,
      color: 'amber',
      description: 'System maintenance and downtime'
    },
    {
      key: 'alert',
      label: 'Important Alert',
      icon: AlertCircleIcon,
      color: 'red',
      description: 'Urgent notifications requiring attention'
    }
  ]

  const audienceOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'customers', label: 'Customers Only' },
    { value: 'businesses', label: 'Businesses Only' },
    { value: 'organisations', label: 'Organisations Only' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!title.trim() || !message.trim()) {
      alert('Please fill in all required fields')
      return
    }

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      alert('Please select both date and time for scheduled notifications')
      return
    }

    const notificationData = {
      title: title.trim(),
      message: message.trim(),
      audience,
      type: notificationType,
      scheduled: isScheduled,
      scheduledDateTime: isScheduled ? `${scheduledDate}T${scheduledTime}` : null
    }

    if (isScheduled) {
      onSchedule(notificationData)
    } else {
      onSend(notificationData)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getMinTime = () => {
    if (scheduledDate === getMinDateTime()) {
      const now = new Date()
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(Math.ceil(now.getMinutes() / 5) * 5).padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return '00:00'
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
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isScheduled ? 'Schedule Notification' : 'Send Notification'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon size={24} />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {/* Notification Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {notificationTypes.map((type) => {
                      const IconComponent = type.icon
                      return (
                        <button
                          key={type.key}
                          type="button"
                          onClick={() => setNotificationType(type.key)}
                          className={`flex items-center px-3 py-2 rounded-md text-sm border transition-colors ${
                            notificationType === type.key
                              ? `bg-${type.color}-100 text-${type.color}-800 border-${type.color}-300`
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className="h-4 w-4 mr-2" />
                          {type.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="notification-title" className="block text-sm font-medium text-gray-700">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="notification-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={255}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter notification title"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">{title.length}/255 characters</p>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700">
                    Message *
                  </label>
                  <textarea
                    id="notification-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={2000}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter notification message"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">{message.length}/2000 characters</p>
                </div>

                {/* Audience */}
                <div>
                  <label htmlFor="notification-audience" className="block text-sm font-medium text-gray-700">
                    Target Audience
                  </label>
                  <select
                    id="notification-audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    {audienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Schedule Toggle */}
                <div>
                  <div className="flex items-center">
                    <input
                      id="schedule-toggle"
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="schedule-toggle" className="ml-2 block text-sm text-gray-900">
                      Schedule for later
                    </label>
                  </div>
                </div>

                {/* Scheduling Options */}
                {isScheduled && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="flex items-center mb-3">
                      <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
                      <h4 className="text-sm font-medium text-blue-900">Schedule Delivery</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="scheduled-date" className="block text-xs font-medium text-blue-700">
                          Date
                        </label>
                        <input
                          type="date"
                          id="scheduled-date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={getMinDateTime()}
                          className="mt-1 block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required={isScheduled}
                        />
                      </div>
                      <div>
                        <label htmlFor="scheduled-time" className="block text-xs font-medium text-blue-700">
                          Time
                        </label>
                        <input
                          type="time"
                          id="scheduled-time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          min={getMinTime()}
                          className="mt-1 block w-full border border-blue-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required={isScheduled}
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-blue-600">
                      Notification will be automatically sent at the specified time
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {isScheduled ? (
                  <>
                    <CalendarIcon size={16} className="mr-2" />
                    Schedule
                  </>
                ) : (
                  <>
                    <SendIcon size={16} className="mr-2" />
                    Send Now
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default NotificationComposer