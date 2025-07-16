import React from 'react'
import { Eye as EyeIcon } from 'lucide-react'
import { Button } from '../Button'
import { StatusBadge } from '../StatusBadge'

export function PendingDonationsTable({ donations, onViewRequest }) {
  if (donations.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No pending donation requests</p>
      </div>
    )
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Request ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Food Item
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            NGO Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date of Request
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {donations.map((donation) => (
          <tr key={donation.id}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {donation.requestId}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded mr-3 overflow-hidden">
                  <img
                    src={donation.imageUrl}
                    alt={donation.itemName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {donation.itemName}
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {donation.ngoName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {new Date(donation.requestDate).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <StatusBadge status={donation.status} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <Button
                variant="secondary"
                size="sm"
                icon={<EyeIcon className="h-4 w-4" />}
                onClick={() => onViewRequest(donation)}
              >
                View Request
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
