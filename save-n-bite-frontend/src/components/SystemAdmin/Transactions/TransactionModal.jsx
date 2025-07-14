import React from 'react'
import { XIcon, AlertTriangleIcon } from 'lucide-react'

const TransactionModal = ({
  transaction,
  onClose,
  onResolve,
  onCancel,
}) => {
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
                    {transaction.status === 'Disputed' && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangleIcon size={12} className="mr-1" />
                        Disputed
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
                            transaction.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-800'
                              : transaction.status === 'Disputed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {transaction.status}
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {transaction.status === 'Disputed' && (
              <button
                type="button"
                onClick={() => onResolve(transaction.id)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Resolve Dispute
              </button>
            )}
            {transaction.status === 'In Progress' && (
              <button
                type="button"
                onClick={() => onCancel(transaction.id)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel Transaction
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
