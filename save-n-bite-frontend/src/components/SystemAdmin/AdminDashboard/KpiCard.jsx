import React from 'react'

const KpiCard = ({
  title,
  value,
  change,
  icon,
  color,
  isNegative = false,
  subtitle,
}) => {
  const colorClasses = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    amber: 'bg-amber-50',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div
          className={`w-12 h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}
        >
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p
              className={`ml-2 text-sm font-medium ${
                isNegative ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {change}
            </p>
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

export default KpiCard
