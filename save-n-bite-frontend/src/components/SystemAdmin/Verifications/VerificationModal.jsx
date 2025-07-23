import React, { useState } from 'react'
import { XIcon, FileTextIcon, ExternalLinkIcon } from 'lucide-react'

const VerificationModal = ({
  verification,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = () => {
    // Send default reason for approval to the DB
    const defaultApprovalReason = 'Documentation verified and approved by admin'
    onApprove(verification.id, defaultApprovalReason)
  }

  const handleReject = () => {
    if (showRejectForm) {
      if (!rejectionReason.trim()) {
        alert('Please provide a reason for rejection')
        return
      }
      onReject(verification.id, rejectionReason)
      setRejectionReason('')
      setShowRejectForm(false)
    } else {
      setShowRejectForm(true)
    }
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
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Verification Request Details
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
                    <h4 className="text-sm font-medium text-gray-500">Request ID</h4>
                    <p className="mt-1 text-sm text-gray-900">{verification.id}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">organisation Name</h4>
                    <p className="mt-1 text-sm text-gray-900">{verification.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">organisation Type</h4>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.type === 'Provider'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {verification.type}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Email</h4>
                    <p className="mt-1 text-sm text-gray-900">{verification.email}</p>
                  </div>
                   <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                    <p className="mt-1 text-sm text-gray-900">{verification.number}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Submitted Date</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(verification.submitted).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.status === 'pending_verification'
                            ? 'bg-yellow-100 text-yellow-800'
                            : verification.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {verification.status}
                      </span>
                    </p>
                  </div>
                  {verification.status === 'Rejected' &&
                    verification.rejectionReason && (
                      <div className="bg-red-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-red-800">Rejection Reason</h4>
                        <p className="mt-1 text-sm text-red-700">
                          {verification.rejectionReason}
                        </p>
                      </div>
                    )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Submitted Documents</h4>
                    <div className="mt-2 space-y-2">
                      {verification.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                        >
                          <div className="flex items-center">
                            <FileTextIcon size={16} className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{doc.name}</span>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <span className="text-xs mr-1">View</span>
                            <ExternalLinkIcon size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  {showRejectForm && (
                    <div>
                      <label
                        htmlFor="rejection-reason"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Rejection Reason
                      </label>
                      <textarea
                        id="rejection-reason"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="Please provide a reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      ></textarea>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {verification.status === 'pending_verification' && (
              <>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {showRejectForm ? 'Submit Rejection' : 'Reject'}
                </button>
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

export default VerificationModal
