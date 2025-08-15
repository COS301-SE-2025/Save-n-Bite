import React, { useState } from 'react'
import { XIcon, FileTextIcon, ExternalLinkIcon, ImageIcon } from 'lucide-react'

const VerificationModal = ({
  verification,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = () => {
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

  // Helper function to get documents in the right format
  const getDocuments = () => {
    if (Array.isArray(verification.documents)) {
      return verification.documents
    }
    
    if (verification.documents && typeof verification.documents === 'object') {
      return Object.entries(verification.documents).map(([key, value]) => ({
        type: key,
        name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        url: value,
        path: value
      }))
    }
    
    if (verification.originalDocuments && typeof verification.originalDocuments === 'object') {
      return Object.entries(verification.originalDocuments).map(([key, value]) => ({
        type: key,
        name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        url: value,
        path: value
      }))
    }
    
    return []
  }

  // Helper to create full URL
  const getFullUrl = (url) => {
    if (!url) return null
    const baseUrl = 'http://localhost:8000'
    return url.startsWith('http') ? url : `${baseUrl}${url}`
  }

  // Helper to check if file is an image
  const isImage = (url) => {
    return url && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
  }

  const documents = getDocuments()

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Verification Request Details
                  </h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <XIcon size={20} />
                  </button>
                </div>
                
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Request ID</h4>
                      <p className="mt-1 text-sm text-gray-900">{verification.id}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Organization Name</h4>
                      <p className="mt-1 text-sm text-gray-900">{verification.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Organization Type</h4>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.type === 'Provider' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
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
                      <p className="mt-1 text-sm text-gray-900">{verification.number || verification.contact}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                      <p className="mt-1 text-sm text-gray-900">{verification.address}</p>
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                          verification.status === 'verified' || verification.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {verification.status === 'pending_verification' ? 'Pending' :
                           verification.status === 'verified' ? 'Approved' :
                           verification.status}
                        </span>
                      </p>
                    </div>

                    {/* Rejection Form */}
                    {showRejectForm && (
                      <div>
                        <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                          Reason for Rejection
                        </label>
                        <textarea
                          id="rejectionReason"
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Please provide a detailed reason for rejecting this verification request..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                        ></textarea>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Documents */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-4">Documents</h4>
                    {documents.length > 0 ? (
                      <div className="space-y-4">
                        {documents.map((document, index) => {
                          const fullUrl = getFullUrl(document.url)
                          const isImg = isImage(document.url)
                          
                          return (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  {isImg ? (
                                    <ImageIcon className="w-4 h-4 text-blue-500 mr-2" />
                                  ) : (
                                    <FileTextIcon className="w-4 h-4 text-gray-400 mr-2" />
                                  )}
                                  <span className="text-sm font-medium text-gray-900">{document.name}</span>
                                </div>
                                {fullUrl && (
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    <ExternalLinkIcon className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                              
                              {/* Document Preview */}
                              {fullUrl && isImg ? (
                                <div className="mt-2">
                                  <img
                                    src={fullUrl}
                                    alt={document.name}
                                    className="max-w-full h-32 object-contain border rounded"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      e.target.nextSibling.style.display = 'block'
                                    }}
                                  />
                                  <div className="hidden text-sm text-gray-500 p-2 bg-gray-50 rounded">
                                    Image preview not available
                                  </div>
                                </div>
                              ) : fullUrl ? (
                                <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  Document available - click the link above to view
                                </div>
                              ) : (
                                <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">
                                  Document not available
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded">
                        No documents uploaded
                      </div>
                    )}
                  </div>
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