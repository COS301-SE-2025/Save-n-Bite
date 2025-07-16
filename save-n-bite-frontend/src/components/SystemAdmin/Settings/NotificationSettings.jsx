import React, { useState } from 'react'
import { toast } from 'sonner'
import { SaveIcon } from 'lucide-react'

const NotificationSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState({
    userActivity: true,
    systemAlerts: true,
    verificationRequests: true,
    disputes: true,
    reportedContent: false,
  })

  const [pushNotifications, setPushNotifications] = useState({
    userActivity: false,
    systemAlerts: true,
    verificationRequests: true,
    disputes: true,
    reportedContent: true,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    toast.success('Notification settings saved')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage the emails you want to receive when various events occur.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            id: 'user-activity',
            label: 'User Activity',
            desc: 'Get notified when significant user activity occurs, like new registrations.',
            key: 'userActivity',
          },
          {
            id: 'system-alerts',
            label: 'System Alerts',
            desc: 'Receive emails for critical system alerts and errors.',
            key: 'systemAlerts',
          },
          {
            id: 'verification-requests',
            label: 'Verification Requests',
            desc: 'Get notified when new verification requests are submitted.',
            key: 'verificationRequests',
          },
          {
            id: 'disputes',
            label: 'Disputes',
            desc: 'Receive emails when transaction disputes are opened.',
            key: 'disputes',
          },
          {
            id: 'reported-content',
            label: 'Reported Content',
            desc: 'Get notified when content is reported by users.',
            key: 'reportedContent',
          },
        ].map(({ id, label, desc, key }) => (
          <div className="flex items-start" key={id}>
            <div className="flex items-center h-5">
              <input
                id={`email-${id}`}
                name={`email-${id}`}
                type="checkbox"
                checked={emailNotifications[key]}
                onChange={() =>
                  setEmailNotifications({
                    ...emailNotifications,
                    [key]: !emailNotifications[key],
                  })
                }
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor={`email-${id}`} className="font-medium text-gray-700">
                {label}
              </label>
              <p className="text-gray-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Push Notifications</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure browser push notifications for important events.
        </p>
      </div>

      <div className="space-y-4">
        {/* Example push notification checkbox */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="push-user-activity"
              name="push-user-activity"
              type="checkbox"
              checked={pushNotifications.userActivity}
              onChange={() =>
                setPushNotifications({
                  ...pushNotifications,
                  userActivity: !pushNotifications.userActivity,
                })
              }
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="push-user-activity" className="font-medium text-gray-700">
              User Activity
            </label>
            <p className="text-gray-500">Get push notifications for significant user activity.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          Save Changes
        </button>
      </div>
    </form>
  )
}

export default NotificationSettings
