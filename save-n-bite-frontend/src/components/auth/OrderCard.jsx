import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Package, Users, Repeat, X, Eye, ChevronDown, ChevronUp, CheckCircle, Clock as ClockIcon } from 'lucide-react';

const OrderCard = ({ order, userType, onOrderAction }) => {
  const [showDetails, setShowDetails] = useState(false);

  const statusConfig = {
    pending: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      icon: <ClockIcon className="w-4 h-4" />,
      label: 'Pending'
    },
    confirmed: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Confirmed'
    },
    completed: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-300',
      icon: <CheckCircle className="w-4 h-4" />,
      label: 'Completed'
    },
    cancelled: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      icon: <X className="w-4 h-4" />,
      label: 'Cancelled'
    }
  };

  const status = statusConfig[order.status] || {
    bg: 'bg-gray-50 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    icon: <ClockIcon className="w-4 h-4" />,
    label: order.status.charAt(0).toUpperCase() + order.status.slice(1)
  };

  const isDonation = order.type === 'donation';
  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canReorder = order.type === 'purchase' && order.status === 'completed';
  const canTrack = order.status === 'pending' || order.status === 'confirmed';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {order.orderNumber}
              </h3>
              <span className={`${status.bg} ${status.text} text-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5`}>
                {status.icon}
                <span>{status.label}</span>
              </span>
            </div>
            <div className="flex items-center mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0" />
              <span>{formatDate(order.date)}</span>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${isDonation ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
            {isDonation ? 'Donation' : 'Purchase'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Items Preview */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex -space-x-2.5">
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index} className="relative group">
                <img
                  src={item.image || '/placeholder-item.jpg'}
                  alt={item.title}
                  className="w-12 h-12 rounded-lg border-2 border-white dark:border-gray-800 object-cover shadow-sm group-hover:z-10 transition-transform duration-200 group-hover:scale-110"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-item.jpg';
                  }}
                />
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700/50 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1 truncate">
              {order.items.length === 1 
                ? order.items[0]?.title || 'Item'
                : `${order.items.length} items${order.provider ? ` from ${order.provider}` : ''}`
              }
            </h4>
            {order.provider && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{order.provider}</span>
              </p>
            )}
          </div>
        </div>

        {/* Order Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md text-blue-500 dark:text-blue-400 flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Pickup Time</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {order.pickupTime !== 'TBD' ? order.pickupTime : 'To be determined'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 rounded-md text-purple-500 dark:text-purple-400 flex-shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Items</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200 flex-1 sm:flex-none"
          >
            {showDetails ? (
              <>
                <span>Less details</span>
                <ChevronUp className="w-4 h-4 ml-1.5" />
              </>
            ) : (
              <>
                <span>More details</span>
                <ChevronDown className="w-4 h-4 ml-1.5" />
              </>
            )}
          </button>
          
          <div className="flex flex-wrap gap-2 justify-end">
            {canCancel && (
              <button
                onClick={() => onOrderAction('cancel', order.id)}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white hover:bg-red-600 dark:hover:bg-red-600/90 rounded-lg border border-red-200 dark:border-red-900 transition-colors duration-200"
              >
                Cancel
              </button>
            )}
            
            {canTrack && (
              <button
                onClick={() => onOrderAction('track', order.id)}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600/90 rounded-lg border border-blue-200 dark:border-blue-900 transition-colors duration-200"
              >
                Track
              </button>
            )}
            
            {canReorder && (
              <button
                onClick={() => onOrderAction('reorder', order.id)}
                className="px-3 py-2 text-sm font-medium text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-white hover:bg-emerald-600 dark:hover:bg-emerald-600/90 rounded-lg border border-emerald-200 dark:border-emerald-900 transition-colors duration-200"
              >
                Reorder
              </button>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 animate-fadeIn">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Order Details</h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 group">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={item.image || '/placeholder-item.jpg'}
                        alt={item.title}
                        className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-700 transition-transform duration-200 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-item.jpg';
                        }}
                      />
                      <span className="absolute -top-1.5 -right-1.5 bg-white dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
                        {item.quantity || 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.description}</p>
                      )}
                    </div>
                  </div>
                  {item.price !== undefined && (
                    <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap ml-2">
                      R{Number(item.price).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {(order.total !== undefined || order.items.some(item => item.price !== undefined)) && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {order.total !== undefined 
                      ? `R${Number(order.total).toFixed(2)}` 
                      : `R${order.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0).toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;