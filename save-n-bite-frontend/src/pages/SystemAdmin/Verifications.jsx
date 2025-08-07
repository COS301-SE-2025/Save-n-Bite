import React, { useState, useEffect } from 'react'
import VerificationFilters from '../../components/SystemAdmin/Verifications/VerificationFilter'
import VerificationTable from '../../components/SystemAdmin/Verifications/VerificationTable'
import VerificationModal from '../../components/SystemAdmin/Verifications/VerificationModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'
import { toast } from 'sonner'

const Verifications = () => {
  // STANDARD STATE SETUP 
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 2. UI STATE 
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('pending_verification')
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [processingAction, setProcessingAction] = useState(false)

  // SETUP AUTHENTICATION + FETCH DATA 
  useEffect(() => {
    setupAuthAndFetchData()
  }, [])

  const setupAuthAndFetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }

      // Set token for API calls
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Fetch verification data
      await fetchVerifications()
      
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
      setLoading(false)
    }
  }

  // API INTEGRATION (following our pattern)
  const fetchVerifications = async () => {
    try {
      setLoading(true)
      console.log('Fetching verifications...')
      
      const response = await AdminAPI.getPendingVerifications()
      console.log('Verifications response:', response)
      
      if (response.success) {
        setVerifications(response.data)
        setError(null)
        console.log('✅ Verifications loaded successfully')
      } else {
        console.error('❌ Verifications API error:', response.error)
        setError(response.error)
        toast.error(response.error || 'Failed to load verifications')
      }
    } catch (error) {
      console.error('❌ Verifications fetch error:', error)
      
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.')
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.')
      } else {
        setError('Failed to fetch verification requests')
      }
      
      toast.error('Failed to load verification requests')
    } finally {
      setLoading(false)
    }
  }

  // FILTER LOGIC 
  const filteredVerifications = verifications.filter((verification) => {
    const matchesSearch =
      verification.name?.toLowerCase().includes(search.toLowerCase()) ||
      verification.email?.toLowerCase().includes(search.toLowerCase()) ||
      verification.id?.toLowerCase().includes(search.toLowerCase())
    
    const matchesType = typeFilter === 'All' || verification.type === typeFilter
    const matchesStatus = statusFilter === 'All' || verification.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  // ACTION HANDLERS 
  const handleViewVerification = (verification) => {
    setSelectedVerification(verification)
    setShowVerificationModal(true)
  }

  const handleApprove = (verificationId, approvalReason) => {
    const verification = verifications.find(v => v.id === verificationId)
    setConfirmAction({
      type: 'approve',
      verificationId,
      reason: approvalReason,
      profileType: verification.type.toLowerCase(), // Provider -> provider, NGO -> ngo
      profileId: verification.id
    })
    setShowConfirmModal(true)
  }

  const handleReject = (verificationId, rejectionReason) => {
    const verification = verifications.find(v => v.id === verificationId)
    setConfirmAction({
      type: 'reject',
      verificationId,
      rejectionReason,
      profileType: verification.type.toLowerCase(), // Provider -> provider, NGO -> ngo  
      profileId: verification.id
    })
    setShowConfirmModal(true)
  }

  // EXECUTE ACTION 
  const executeAction = async () => {
    if (!confirmAction || processingAction) return

    setProcessingAction(true)
    
    try {
      const { type, profileType, profileId, rejectionReason } = confirmAction
      const newStatus = type === 'approve' ? 'Approved' : 'Rejected'
      const reason = rejectionReason || 'Verification processed'

      console.log('Processing verification action:', {
        profileType,
        profileId, 
        newStatus,
        reason
      })

      // Call the real API
      const response = await AdminAPI.updateVerificationStatus(
        profileType, // 'provider' or 'ngo'
        profileId,
        newStatus,   // 'Approved' or 'Rejected'
        reason
      )

      if (response.success) {
        // Update local state to reflect the change
        setVerifications(prev =>
          prev.map(verification =>
            verification.id === confirmAction.verificationId
              ? { 
                  ...verification, 
                  status: newStatus.toLowerCase(),
                  rejectionReason: type === 'reject' ? rejectionReason : undefined
                }
              : verification
          )
        )

        toast.success(`Verification request ${confirmAction.verificationId} has been ${type === 'approve' ? 'approved' : 'rejected'}`)
        
        // Close modals
        setShowConfirmModal(false)
        setShowVerificationModal(false)
        setConfirmAction(null)
      } else {
        toast.error(response.error || `Failed to ${type} verification`)
        console.error(`Failed to ${type} verification:`, response.error)
      }
    } catch (error) {
      console.error('Error processing verification:', error)
      toast.error(`Failed to ${confirmAction.type} verification`)
    } finally {
      setProcessingAction(false)
    }
  }

  // LOADING STATE 
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        </div>
        
        {/* Filters skeleton */}
        <div className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow animate-pulse">
          <div className="p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4 border-b">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ERROR STATE 
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Verifications</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={fetchVerifications}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MAIN RENDER 
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Verification Requests
        </h1>
        <p className="text-gray-500">
          Review and process verification requests
        </p>
      </div>

      <VerificationFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <VerificationTable
        verifications={filteredVerifications}
        onViewVerification={handleViewVerification}
      />

      {showVerificationModal && selectedVerification && (
        <VerificationModal
          verification={selectedVerification}
          onClose={() => setShowVerificationModal(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'approve'
              ? 'Approve Verification'
              : 'Reject Verification'
          }
          message={
            confirmAction.type === 'approve'
              ? 'Are you sure you want to approve this verification request? This will grant the organisation verified status on the platform.'
              : 'Are you sure you want to reject this verification request? The organisation will need to resubmit their documents.'
          }
          confirmButtonText={processingAction ? 'Processing...' : 'Confirm'}
          confirmButtonColor={confirmAction.type === 'approve' ? 'green' : 'red'}
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
          disabled={processingAction}
        />
      )}
    </div>
  )
}

export default Verifications