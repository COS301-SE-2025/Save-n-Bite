import React, { useState } from 'react'
import { XIcon, FlagIcon } from 'lucide-react'

const ListingModal = ({ listing, onClose, onRemove, onFlag }) => {
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [showRemoveForm, setShowRemoveForm] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [removeReason, setRemoveReason] = useState('')

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'flagged':
        return 'bg-amber-100 text-amber-800'
      case 'removed':
        return 'bg-red-100 text-red-800'
      case 'sold_out':
        return 'bg-gray-100 text-gray-800'
      case 'expired':
        return 'bg-purple-100 text-purple-800'
      case 'inactive':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'flagged':
        return 'Flagged'
      case 'removed':
        return 'Removed'
      case 'sold_out':
        return 'Sold Out'
      case 'expired':
        return 'Expired'
      case 'inactive':
        return 'Inactive'
      default:
        return status
    }
  }

  const handleFlag = () => {
    if (showFlagForm) {
      if (!flagReason.trim()) {
        alert('Please provide a reason for flagging this listing')
        return
      }
      onFlag(listing.id, flagReason)
      setFlagReason('')
      setShowFlagForm(false)
    } else {
      setShowFlagForm(true)
    }
  }

  const handleRemove = () => {
    if (showRemoveForm) {
      if (!removeReason.trim()) {
        alert('Please provide a reason for removing this listing')
        return
      }
      onRemove(listing.id, removeReason)
      setRemoveReason('')
      setShowRemoveForm(false)
    } else {
      setShowRemoveForm(true)
    }
  }

  const handleCancelFlag = () => {
    setShowFlagForm(false)
    setFlagReason('')
  }

  const handleCancelRemove = () => {
    setShowRemoveForm(false)
    setRemoveReason('')
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
            <div className="flex items-start justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Listing Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon size={24} />
              </button>
            </div>
            <div className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    className="h-16 w-16 rounded-md object-cover"
                    src={listing.image}
                    alt={listing.name}
                  />
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">
                      {listing.name}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}
                    >
                      {getStatusDisplay(listing.status)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Provider
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {listing.provider}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Type
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {listing.type}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Price
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {listing.price}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Created
                    </h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(listing.created).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {(listing.status === 'flagged' || listing.status === 'removed') && listing.reason && (
                  <div className={`p-3 rounded-md ${listing.status === 'flagged' ? 'bg-amber-50' : 'bg-red-50'}`}>
                    <h4 className={`text-sm font-medium ${listing.status === 'flagged' ? 'text-amber-800' : 'text-red-800'}`}>
                      {listing.status === 'flagged' ? 'Flag Reason' : 'Removal Reason'}
                    </h4>
                    <p className={`mt-1 text-sm ${listing.status === 'flagged' ? 'text-amber-700' : 'text-red-700'}`}>
                      {listing.reason}
                    </p>
                  </div>
                )}

                {showFlagForm && (
                  <div>
                    <label
                      htmlFor="flag-reason"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Flag Reason *
                    </label>
                    <textarea
                      id="flag-reason"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                      placeholder="Please provide a reason for flagging this listing..."
                      value={flagReason}
                      onChange={(e) => setFlagReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                )}

                {showRemoveForm && (
                  <div>
                    <label
                      htmlFor="remove-reason"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Removal Reason *
                    </label>
                    <textarea
                      id="remove-reason"
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Please provide a reason for removing this listing..."
                      value={removeReason}
                      onChange={(e) => setRemoveReason(e.target.value)}
                      required
                    ></textarea>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {listing.status !== 'removed' && (
              <>
                {!showFlagForm && !showRemoveForm ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={handleFlag}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Flag
                    </button>
                  </>
                ) : showFlagForm ? (
                  <>
                    <button
                      type="button"
                      onClick={handleFlag}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Confirm Flag
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelFlag}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleRemove}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Confirm Removal
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRemove}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListingModal