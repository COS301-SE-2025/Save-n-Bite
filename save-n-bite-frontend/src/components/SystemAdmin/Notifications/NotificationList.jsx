import React from 'react'
import {
  BellIcon,
  TrashIcon,
  UsersIcon,
  BuildingIcon,
  HeartIcon,
} from 'lucide-react'

const NotificationList = ({ notifications, onDelete }) => {
  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'All Users':
        return <UsersIcon size={16} className="text-blue-600" />
      case 'Providers':
        return <BuildingIcon size={16} className="text-purple-600" />
      case 'Consumers':
        return <UsersIcon size={16} className="text-green-600" />
      case 'NGOs':
        return <HeartIcon size={16} className="text-red-600" />
      default:
        return <UsersIcon size={16} className="text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {notifications.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div key={notification.id} className="p-6">
              <div className="flex justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <BellIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        Sent by {notification.sender}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(notification.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {notification.message}
                    </div>
                    <div className="mt-2 flex items-center">
                      <div className="flex items-center mr-4">
                        {getAudienceIcon(notification.audience)}
                        <span className="ml-1 text-xs text-gray-500">
                          {notification.audience}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500">
                          Read by {notification.readCount} users
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => onDelete(notification.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="Delete Notification"
                  >
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-500">No notifications found.</p>
        </div>
      )}
    </div>
  )
}

export default NotificationList
