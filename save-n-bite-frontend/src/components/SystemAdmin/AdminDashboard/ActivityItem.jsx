import React from 'react'
import {
  UsersIcon,
  AlertOctagonIcon,
  LeafIcon,
  ShoppingBagIcon,
} from 'lucide-react'

const ActivityItem = ({ title, description, time, type }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800'
      case 'warning':
        return 'bg-amber-100 text-amber-800'
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'info':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="px-6 py-4">
      <div className="flex items-start">
        <span
          className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${getTypeStyles()}`}
        >
          {type === 'user' && <UsersIcon size={16} />}
          {type === 'warning' && <AlertOctagonIcon size={16} />}
          {type === 'success' && <LeafIcon size={16} />}
          {type === 'info' && <ShoppingBagIcon size={16} />}
        </span>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
    </div>
  )
}

export default ActivityItem
