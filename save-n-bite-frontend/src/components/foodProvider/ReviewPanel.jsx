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
  if (!order.review) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Close review panel"
      >
        <CloseIcon className="h-5 w-5" />
      </button>


      <div className="mb-6">
        <div className="flex items-center mb-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`h-5 w-5 ${
                i < order.review.rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
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

    </div>
  );
}