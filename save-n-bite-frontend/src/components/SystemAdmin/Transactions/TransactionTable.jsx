import React from 'react'
import {
  EyeIcon,
  AlertTriangleIcon,
} from 'lucide-react'

const TransactionTable = ({
  transactions,
  onViewTransaction,
}) => {
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'preparing':
        return 'Preparing'
      case 'ready_for_pickup':
        return 'Ready for Pickup'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'expired':
        return 'Expired'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parties
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type/Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.provider.name}
                      </div>
                      <div className="text-xs text-gray-500">Provider</div>
                      <div className="text-sm font-medium text-gray-900 mt-1">
                        {transaction.consumer.name}
                      </div>
                      <div className="text-xs text-gray-500">Consumer</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'Sale'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                      <span className="text-sm text-gray-900 mt-1">
                        {transaction.amount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'confirmed' || transaction.status === 'ready_for_pickup'
                          ? 'bg-blue-100 text-blue-800'
                          : transaction.status === 'preparing'
                          ? 'bg-yellow-100 text-yellow-800'
                          : transaction.status === 'pending'
                          ? 'bg-orange-100 text-orange-800'
                          : transaction.status === 'cancelled' || transaction.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : transaction.status === 'expired'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {(transaction.status === 'cancelled' || transaction.status === 'rejected' || transaction.status === 'expired') && (
                        <AlertTriangleIcon size={12} className="mr-1" />
                      )}
                      {getStatusDisplay(transaction.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onViewTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <EyeIcon size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No transactions found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TransactionTable