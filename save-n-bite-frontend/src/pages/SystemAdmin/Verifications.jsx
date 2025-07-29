import React, { useState } from 'react'
import VerificationFilters from '../../components/SystemAdmin/Verifications/VerificationFilter'
import VerificationTable from '../../components/SystemAdmin/Verifications/VerificationTable'
import VerificationModal from '../../components/SystemAdmin/Verifications/VerificationModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'

// Mock data for verification requests
const mockVerifications = [
  {
    id: 'VER001',
    name: 'Fresh Harvest Market',
    type: 'Provider',
    email: 'contact@freshharvest.com',
    number: '071 234 5567',
    submitted: '2023-08-10',
    status: 'pending_verification',
    documents: [
      {
        name: 'Business License',
        url: 'https://example.com/license.pdf',
      },
      {
        name: 'Health Certificate',
        url: 'https://example.com/certificate.pdf',
      },
    ],
  },
  {
    id: 'VER002',
    name: 'Community Food Bank',
    type: 'NGO',
    email: 'help@communityfood.org',
    number: '071 234 5567',
    submitted: '2023-08-09',
    status: 'pending_verification',
    documents: [
      {
        name: 'NGO Registration',
        url: 'https://example.com/ngo-reg.pdf',
      },
      {
        name: 'Tax Exemption Certificate',
        url: 'https://example.com/tax-exempt.pdf',
      },
    ],
  },
  {
    id: 'VER003',
    name: 'Local Bakery',
    type: 'Provider',
    email: 'info@localbakery.com',
    number: '071 234 5567',
    submitted: '2023-08-08',
    status: 'pending_verification',
    documents: [
      {
        name: 'Business License',
        url: 'https://example.com/license.pdf',
      },
      {
        name: 'Food Handling Certificate',
        url: 'https://example.com/food-cert.pdf',
      },
    ],
  },
  {
    id: 'VER004',
    name: 'Hunger Relief',
    type: 'NGO',
    email: 'contact@hungerrelief.org',
    number: '071 234 5567',
    submitted: '2023-08-07',
    status: 'verified',
    documents: [
      {
        name: 'NGO Registration',
        url: 'https://example.com/ngo-reg.pdf',
      },
      {
        name: 'Annual Report',
        url: 'https://example.com/report.pdf',
      },
    ],
  },
  {
    id: 'VER005',
    name: 'City Supermarket',
    type: 'Provider',
    email: 'support@citysupermarket.com',
    number: '071 234 5567',
    submitted: '2023-08-06',
    status: 'rejected',
    documents: [
      {
        name: 'Business License',
        url: 'https://example.com/license.pdf',
      },
    ],
    rejectionReason: 'Incomplete documentation provided',
  },
]

const Verifications = () => {
  const [verifications, setVerifications] = useState(mockVerifications)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('pending_verification')
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const filteredVerifications = verifications.filter((verification) => {
    const matchesSearch =
      verification.name.toLowerCase().includes(search.toLowerCase()) ||
      verification.email.toLowerCase().includes(search.toLowerCase()) ||
      verification.id.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'All' || verification.type === typeFilter
    const matchesStatus = statusFilter === 'All' || verification.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleViewVerification = (verification) => {
    setSelectedVerification(verification)
    setShowVerificationModal(true)
  }

  const handleApprove = (verificationId, approvalReason) => {
    setConfirmAction({
      type: 'approve',
      verificationId,
      reason: approvalReason
    })
    setShowConfirmModal(true)
  }

  const handleReject = (verificationId, rejectionReason) => {
    setConfirmAction({
      type: 'reject',
      verificationId,
      rejectionReason,
    })
    setShowConfirmModal(true)
  }

  const executeAction = () => {
    if (!confirmAction) return

    const { type, verificationId, rejectionReason } = confirmAction

    if (type === 'approve') {
      setVerifications(
        verifications.map((verification) =>
          verification.id === verificationId
            ? { ...verification, status: 'verified' }
            : verification
        )
      )
      toast.success(`Verification request ${verificationId} has been approved`)
    } else if (type === 'reject') {
      setVerifications(
        verifications.map((verification) =>
          verification.id === verificationId
            ? {
                ...verification,
                status: 'rejected',
                rejectionReason: rejectionReason || 'No reason provided',
              }
            : verification
        )
      )
      toast.success(`Verification request ${verificationId} has been rejected`)
    }
    setShowConfirmModal(false)
    setConfirmAction(null)
    setShowVerificationModal(false)
  }

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
          confirmButtonText="Confirm"
          confirmButtonColor={confirmAction.type === 'approve' ? 'green' : 'red'}
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Verifications
