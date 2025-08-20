import React from 'react'
import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const QuickLinkCard = ({ title, description, link, color }) => {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  }
  return (
    <Link
      to={link}
      className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div
        className={`px-6 py-3 flex justify-between items-center ${colorClasses[color]}`}
      >
        <span className="text-sm font-medium text-white">View</span>
        <ArrowRightIcon size={16} className="text-white" />
      </div>
    </Link>
  )
}

export default QuickLinkCard
