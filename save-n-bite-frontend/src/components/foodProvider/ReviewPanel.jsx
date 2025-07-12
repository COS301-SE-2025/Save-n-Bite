import React from 'react';
import {
  Star as StarIcon,
  Flag as FlagIcon,
  CheckCircle as CheckIcon,
  MessageCircle as MessageIcon,
  X as CloseIcon
} from 'lucide-react';
import { Button } from '../../components/foodProvider/Button';

export function ReviewPanel({ order, onClose, onResolve, onReply, onReport }) {
  if (!order.reviews || order.reviews.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative max-h-96 overflow-y-auto">

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close review panel"
      >
        <CloseIcon className="h-5 w-5" />
      </button>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Reviews for Order #{order.orderId}
        </h3>
        <p className="text-sm text-gray-600">
          {order.itemName} • {order.customerName}
        </p>
      </div>

      {order.reviews.map((review, index) => (
        <div key={review.id || index} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`h-5 w-5 ${
                  i < review.rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-sm text-gray-600">
              {review.rating} out of 5
            </span>
            <span className="ml-2 text-xs text-gray-500">
              • {review.reviewType === 'provider' ? 'Provider Review' : 'Item Review'}
            </span>
          </div>
          
          <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
            <div>
              <p className="font-medium">Customer</p>
              <p>{review.customerName || 'Anonymous'}</p>
            </div>
            <div>
              <p className="font-medium">Review Date</p>
              <p>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
          
          {review.itemName && (
            <div className="mt-2 text-xs text-gray-500">
              <p><strong>Item:</strong> {review.itemName}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}