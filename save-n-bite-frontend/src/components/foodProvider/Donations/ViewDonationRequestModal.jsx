import React, { useState } from 'react'
import { X as CloseIcon, Download as DownloadIcon } from 'lucide-react'
import { Button } from '../Button'
import { StatusBadge } from '../StatusBadge'

export function ViewDonationRequestModal({
  donation,
  onClose,
  onAccept,
  onReject,
}) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleAccept = () => {
    onAccept(donation.id)
  }

  const handleReject = () => {
    if (showRejectForm) {
      onReject(donation.id, rejectionReason)
    } else {
      setShowRejectForm(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative bg-white rounded-lg max-w-2xl w-full mx-auto shadow-xl">
          <div className="flex justify-between items-center p-6 border-b">
            <h3 className="text-lg font-medium">Donation Request Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Food Item Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-4">Food Item Information</h4>
                <div className="flex items-start mb-4">
                  <div className="h-16 w-16 bg-gray-200 rounded mr-3 overflow-hidden">
                    <img
                      src={donation.imageUrl}
                      alt={donation.itemName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{donation.itemName}</div>
                    <div className="text-sm text-gray-500">
                      Quantity: {donation.quantity}
                    </div>
                    <div className="text-sm text-gray-500">
                      Expiry:{' '}
                      {new Date(donation.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{donation.description}</p>
              </div>

              {/* NGO Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-4">NGO Information</h4>
                <div className="flex items-center mb-3">
                  {donation.ngoLogo && (
                    <div className="h-10 w-10 bg-gray-200 rounded-full mr-3 overflow-hidden">
                      <img
                        src={donation.ngoLogo}
                        alt={donation.ngoName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="font-medium">{donation.ngoName}</div>
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  Contact: {donation.ngoContact}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {donation.ngoDescription}
                </p>
              </div>
            </div>

            {/* Motivation Message */}
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Motivation for Request</h4>
              <p className="text-sm text-gray-700">
                {donation.motivationMessage}
              </p>
            </div>

            {/* Documents */}
            {donation.documents && donation.documents.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Supporting Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {donation.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center border rounded p-2 bg-gray-50"
                    >
                      <span className="text-sm text-gray-600 mr-2">
                        {doc.name}
                      </span>
                      <button className="text-blue-500 hover:text-blue-600">
                        <DownloadIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Details */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div>
                <span className="text-sm text-gray-500">Request ID:</span>
                <span className="ml-2 text-sm font-medium">
                  {donation.requestId}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Date Requested:</span>
                <span className="ml-2 text-sm font-medium">
                  {new Date(donation.requestDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <span className="ml-2">
                  <StatusBadge status={donation.status} />
                </span>
              </div>
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
              <div className="mt-6 bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-red-700">
                  Rejection Reason
                </h4>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Please provide a reason for rejecting this donation request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              disabled={showRejectForm && !rejectionReason.trim()}
            >
              {showRejectForm ? 'Confirm Rejection' : 'Reject Request'}
            </Button>
            {!showRejectForm && (
              <Button variant="success" onClick={handleAccept}>
                Accept Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
