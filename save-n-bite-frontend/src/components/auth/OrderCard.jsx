import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Package, Users, Repeat, X, Eye } from 'lucide-react';

const OrderCard = ({ order, userType, onOrderAction }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
      confirmed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
      completed: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
      cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700';
  };

  const getTypeColor = (type) => {
    return type === 'donation' 
      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-800'
      : 'bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';
  };

  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canReorder = order.type === 'purchase' && order.status === 'completed';
  const canTrack = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">
              {order.orderNumber}
            </h3>
            <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-300">
              <Calendar size={14} className="mr-1" />
              {new Date(order.date).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(order.type)}`}>
              {order.type === 'donation' ? 'Donation' : 'Purchase'}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {/* Items Preview */}
        <div className="flex items-center mb-4">
          <div className="flex -space-x-2 mr-3">
            {order.items.slice(0, 3).map((item, index) => (
              <img
                key={index}
                src={item.image}
                alt={item.title}
                className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 object-cover"
              />
            ))}
            {order.items.length > 3 && (
              <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">
              {order.items.length === 1 
                ? order.items[0].title
                : `${order.items.length} items from ${order.provider}`
              }
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
              <MapPin size={12} className="mr-1" />
              {order.provider}
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Clock size={14} className="mr-2" />
            <div>
              <span className="font-medium">Pickup:</span>
              <br />
              {order.pickupTime !== 'TBD' ? order.pickupTime : 'To be determined'}
            </div>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <MapPin size={14} className="mr-2" />
            <div>
              <span className="font-medium">Location:</span>
              <br />
              {order.pickupAddress}
            </div>
          </div>

          {userType === 'customer' ? (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Package size={14} className="mr-2" />
              <div>
                <span className="font-medium">Total:</span>
                <br />
                {order.type === 'purchase' ? `R${order.total.toFixed(2)}` : 'Free'}
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Users size={14} className="mr-2" />
              <div>
                <span className="font-medium">Beneficiaries:</span>
                <br />
                {order.beneficiaries || order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </div>
          )}
        </div>

        {/* Impact */}
        {order.impact && (
          <div className="bg-emerald-50 dark:bg-emerald-900 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-emerald-800 dark:text-emerald-200">Meals Saved:</span>
                <span className="ml-2 text-emerald-700 dark:text-emerald-200">{order.impact.mealsSaved}</span>
              </div>
              <div>
                <span className="font-medium text-emerald-800 dark:text-emerald-200">CO₂ Reduced:</span>
                <span className="ml-2 text-emerald-700 dark:text-emerald-200">{order.impact.co2Reduced.toFixed(1)} kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Eye size={14} className="mr-1" />
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>

          {canTrack && (
            <button
              onClick={() => onOrderAction(order.id, 'track')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-900 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <Package size={14} className="mr-1" />
              Track Order
            </button>
          )}

          {canReorder && (
            <button
              onClick={() => onOrderAction(order.id, 'reorder')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
            >
              <Repeat size={14} className="mr-1" />
              Reorder
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onOrderAction(order.id, 'cancel')}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              <X size={14} className="mr-1" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Detailed Items View */}
      {showDetails && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-3">Order Items</h4>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-12 h-12 rounded-md object-cover mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{item.provider}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    Qty: {item.quantity}
                  </p>
                  {order.type === 'purchase' && (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      R{(item.price * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {order.type === 'purchase' && (
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 dark:text-gray-100">Total:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg">
                  R{order.total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;