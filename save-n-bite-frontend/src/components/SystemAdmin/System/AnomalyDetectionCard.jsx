// components/SystemAdmin/System/AnomalyDetectionCard.jsx
import React from 'react'
import {
  AlertTriangleIcon,
  ShieldAlertIcon,
  AlertCircleIcon,
  InfoIcon,
  ClockIcon,
  CheckCircleIcon
} from 'lucide-react'

const AnomalyDetectionCard = ({ anomalies }) => {
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Critical':
        return <ShieldAlertIcon className="w-5 h-5 text-red-600" />
      case 'High':
        return <AlertTriangleIcon className="w-5 h-5 text-orange-600" />
      case 'Medium':
        return <AlertCircleIcon className="w-5 h-5 text-yellow-600" />
      case 'Low':
        return <InfoIcon className="w-5 h-5 text-blue-600" />
      default:
        return <InfoIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'border-red-500 bg-red-50'
      case 'High':
        return 'border-orange-500 bg-orange-50'
      case 'Medium':
        return 'border-yellow-500 bg-yellow-50'
      case 'Low':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const getSeverityBadgeColor = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-600 text-white'
      case 'High':
        return 'bg-orange-600 text-white'
      case 'Medium':
        return 'bg-yellow-600 text-white'
      case 'Low':
        return 'bg-blue-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow border">
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg">
          <h3 className="text-lg font-semibold flex items-center">
            <ShieldAlertIcon className="w-6 h-6 mr-2" />
            Security Status
          </h3>
        </div>
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-800">
              <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
              <span className="font-medium">No security anomalies detected in the last 24 hours.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="bg-rose-600 text-white px-6 py-4 rounded-t-lg">
        <h3 className="text-lg font-semibold flex items-center">
          <ShieldAlertIcon className="w-6 h-6 mr-2" />
          Security Anomalies Detected
          <span className="ml-2 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
            {anomalies.length}
          </span>
        </h3>
      </div>
      <div className="p-6 space-y-4">
        {anomalies.map((anomaly, index) => (
          <div
            key={index}
            className={`border-l-4 rounded-lg p-4 ${getSeverityColor(anomaly.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  {getSeverityIcon(anomaly.severity)}
                  <h4 className="text-lg font-medium text-gray-900 ml-2">
                    {anomaly.type}
                  </h4>
                </div>
                <p className="text-gray-700 mb-3">{anomaly.description}</p>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <div className="flex items-center">
                    <strong className="mr-1">Affected:</strong>
                    <span>{anomaly.affected_resource || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <strong className="mr-1">Detected:</strong>
                    <span>{new Date(anomaly.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityBadgeColor(anomaly.severity)}`}>
                  {anomaly.severity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnomalyDetectionCard