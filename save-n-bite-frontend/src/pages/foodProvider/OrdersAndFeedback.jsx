import React, { useState } from 'react'
import { Search as SearchIcon, Calendar as CalendarIcon } from 'lucide-react'
import OrdersTable  from '../../components/foodProvider/OrdersTable'
import { ReviewPanel } from '../../components/foodProvider/ReviewPanel'
import { BusinessFeedback } from '../../components/foodProvider/FoodProviderFeedback'
import { Button } from '../../components/foodProvider/Button'
import { ordersData, businessFeedbackData } from '../../utils/MockData'
import SideBar from '../../components/foodProvider/SideBar';

function OrdersAndFeedback() {
  const [selectedOrder, setSelectedOrder] = useState(null)
   const [showReviews, setShowReviews] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const filteredOrders = ordersData.filter((order) => {
    const matchesType =
      filterType === 'all' ||
      order.type.toLowerCase() === filterType.toLowerCase()
    const matchesStatus =
      filterStatus === 'all' ||
      order.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      order.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })
  
   const handleViewReviews = (order) => {
  if (!order.hasReview) {
    alert("This order has no reviews yet");

    return;
  }
  setSelectedOrder(order);
  setShowReviews(true);
};


  return (
    <div className="w-full flex min-h-screen">
             <SideBar onNavigate={() => {}} currentPage="dashboard" />
                 <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders & Feedback</h1>
          <p className="text-gray-600 mt-1">
            Manage your orders and customer reviews
          </p>
        </div>
      </div>
      {/* Business Feedback Summary Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-5 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-2xl font-bold text-gray-900">
                {businessFeedbackData.averageRating}
              </span>
              <svg
                className="h-6 w-6 text-yellow-400 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <svg
                className="h-6 w-6 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-2xl font-bold text-gray-900">
                {businessFeedbackData.totalReviews}
              </span>
            </div>
            <p className="text-sm text-gray-500">Total Reviews</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <svg
                className="h-6 w-6 text-purple-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-2xl font-bold text-gray-900">
                {businessFeedbackData.followers}
              </span>
            </div>
            <p className="text-sm text-gray-500">Followers</p>
          </div>
          <div className="col-span-2">
            {/* <div className="bg-blue-50 rounded-lg p-3 h-full flex flex-col justify-center">
              <p className="text-sm text-blue-800 mb-1 italic">
                "{businessFeedbackData.recentHighlight.comment}"
              </p>
              <p className="text-xs text-blue-600">
                - {businessFeedbackData.recentHighlight.author} •{' '}
                {new Date(
                  businessFeedbackData.recentHighlight.date,
                ).toLocaleDateString()}
              </p>
            </div> */}
          </div>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by order ID, item or customer..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="sale">Sales</option>
            <option value="donation">Donations</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="never collected">Never Collected</option>
          </select>
          <Button
            variant="secondary"
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            Date Range
          </Button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <OrdersTable
          orders={filteredOrders}
          onViewReviews={handleViewReviews}
        />
      </div>
      {/* {selectedOrder && (
        <div className="mt-6">
          <ReviewPanel
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onResolve={() => {
              // Handle resolve
            }}
            onReply={() => {
              // Handle reply
            }}
            onReport={() => {
              // Handle report
            }}
          />
        </div>
      )} */}

      {showReviews && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReviewPanel
                order={selectedOrder}
                onClose={() => setShowReviews(false)}
                onResolve={() => setShowReviews(false)}
                onReply={() => {}}
                onReport={() => {}}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersAndFeedback;