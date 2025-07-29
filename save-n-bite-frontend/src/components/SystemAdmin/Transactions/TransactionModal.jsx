import React from 'react'
import { XIcon, AlertTriangleIcon } from 'lucide-react'

const TransactionModal = ({
  transaction,
  onClose,
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
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    Transaction Details
                    {(transaction.status === 'cancelled' || transaction.status === 'rejected' || transaction.status === 'expired') && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangleIcon size={12} className="mr-1" />
                        {getStatusDisplay(transaction.status)}
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Transaction ID
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {transaction.id}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Provider
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {transaction.provider.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.provider.id}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Consumer
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {transaction.consumer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.consumer.id}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Item</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {transaction.item}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Type
                      </h4>
                      <p className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'Sale'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Amount
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {transaction.amount}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Status
                      </h4>
                      <p className="mt-1">
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
                          {getStatusDisplay(transaction.status)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Date
                      </h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {transaction.dispute && (
                    <div className="bg-red-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-red-800">
                        Dispute Information
                      </h4>
                      <div className="mt-2 space-y-2">
                        <div>
                          <h5 className="text-xs font-medium text-red-700">
                            Reason
                          </h5>
                          <p className="text-sm text-red-700">
                            {transaction.dispute.reason}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-xs font-medium text-red-700">
                            Date Reported
                          </h5>
                          <p className="text-sm text-red-700">
                            {new Date(
                              transaction.dispute.date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-xs font-medium text-red-700">
                            Status
                          </h5>
                          <p className="text-sm text-red-700">
                            {transaction.dispute.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-yellow-50 rounded border">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Transaction disputes are handled through the platform's dispute resolution process. Contact the respective parties directly or escalate to customer support if needed.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Admin Note:</strong> This is a read-only view for monitoring purposes. Transaction modifications must be handled by the respective parties through the platform's standard processes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionModal