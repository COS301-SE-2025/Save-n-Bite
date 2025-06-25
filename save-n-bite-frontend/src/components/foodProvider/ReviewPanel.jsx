import React from 'react'
import {
  Star as StarIcon,
  Flag as FlagIcon,
  CheckCircle as CheckIcon,
  MessageCircle as MessageIcon,
} from 'lucide-react'
import { Button } from '../Button'
type Review = {
  rating: number
  comment: string
  date: string
  isPositive: boolean
  isResolved: boolean
}
type ReviewPanelProps = {
  order: {
    itemName: string
    customerName: string
    date: string
    review?: Review
  }
  onClose: () => void
  onResolve: () => void
  onReply: () => void
  onReport: () => void
}
export function ReviewPanel({
  order,
  onClose,
  onResolve,
  onReply,
  onReport,
}: ReviewPanelProps) {
  if (!order.review) return null
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Review Details</h3>
          <p className="text-sm text-gray-500">For order: {order.itemName}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${order.review.isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {order.review.isPositive ? 'Positive' : 'Needs Attention'}
          </span>
          {order.review.isResolved && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              Resolved
            </span>
          )}
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`h-5 w-5 ${i < order.review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            />
          ))}
          <span className="ml-2 text-sm text-gray-600">
            {order.review.rating} out of 5
          </span>
        </div>
        <p className="text-gray-700 text-sm mt-2">{order.review.comment}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
        <div>
          <p className="font-medium">Customer</p>
          <p>{order.customerName}</p>
        </div>
        <div>
          <p className="font-medium">Review Date</p>
          <p>{new Date(order.review.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        {!order.review.isResolved && (
          <Button
            variant="success"
            icon={<CheckIcon className="h-4 w-4" />}
            onClick={onResolve}
          >
            Mark as Resolved
          </Button>
        )}
        <Button
          variant="secondary"
          icon={<MessageIcon className="h-4 w-4" />}
          onClick={onReply}
        >
          Reply
        </Button>
        <Button
          variant="danger"
          icon={<FlagIcon className="h-4 w-4" />}
          onClick={onReport}
        >
          Report
        </Button>
      </div>
    </div>
  )
}
