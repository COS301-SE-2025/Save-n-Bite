import React from 'react'
import {
  Eye as EyeIcon,
  MessageCircle as MessageIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
} from 'lucide-react'
import { StatusBadge } from '../../components/foodProvider/StatusBadge'
import { Button } from '../../components/foodProvider/Button'


function OrdersTable({ orders, onViewReviews }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-300">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Order ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Food Item
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Pickup Window
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-white-300 uppercase tracking-wider">
              Reviews
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-white-100">
                {order.orderId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded mr-3 overflow-hidden">
                    <img
                      src={order.imageUrl}
                      alt={order.itemName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white-100">
                    {order.itemName}
                    {order.hasReview && (
                      <MessageIcon className="h-4 w-4 text-blue-500 dark:text-blue-400 inline ml-2" />
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-white-100">
                {order.customerName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-white-100">
                <div className="flex items-center space-x-2">
                  <a
                    href={`mailto:${order.customerEmail}`}
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <MailIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <PhoneIcon className="h-4 w-4" />
                  </a>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.type === 'Sale'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                      : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300'
                  }`}
                >
                  {order.type}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-white-100">
                <div>
                  <div>{new Date(order.pickupDate).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400 dark:text-white-300">
                    {order.pickupWindow}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<EyeIcon className="h-4 w-4" />}
                  onClick={() => onViewReviews(order)}
                  className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-white-100 border border-gray-300 dark:border-gray-700"
                >
                  View Reviews
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


export default OrdersTable;