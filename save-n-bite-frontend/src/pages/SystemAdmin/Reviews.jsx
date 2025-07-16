import React, { useState } from 'react'
import ReviewFilters from '../../components/SystemAdmin/Reviews/ReviewFilters'
import ReviewTable from '../../components/SystemAdmin/Reviews/ReviewTable'
import ReviewModal from '../../components/SystemAdmin/Reviews/ReviewModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'

// Mock data for reviews
const mockReviews = [
  {
    id: 'REV001',
    reviewer: { name: 'John Smith', id: 'USR001' },
    subject: { name: 'Fresh Harvest Market', id: 'USR003', type: 'Provider' },
    rating: 4,
    content:
      'Great quality food at a reasonable price. The vegetables were fresh and lasted well.',
    date: '2023-08-10',
    status: 'Published',
    flagged: false,
  },
  {
    id: 'REV002',
    reviewer: { name: 'Jane Doe', id: 'USR002' },
    subject: { name: 'Local Bakery', id: 'USR008', type: 'Provider' },
    rating: 5,
    content:
      'Amazing bread and pastries. Everything was delicious and freshly baked!',
    date: '2023-08-09',
    status: 'Published',
    flagged: false,
  },
  {
    id: 'REV003',
    reviewer: { name: 'Alex Johnson', id: 'USR007' },
    subject: { name: 'Green Grocers', id: 'USR005', type: 'Provider' },
    rating: 2,
    content:
      'The produce was not as fresh as advertised. Some items were already going bad when I picked them up.',
    date: '2023-08-08',
    status: 'Published',
    flagged: true,
    flagReason: 'Dispute from provider about accuracy',
  },
  {
    id: 'REV004',
    reviewer: { name: 'Community Food Bank', id: 'USR006' },
    subject: { name: 'Fresh Harvest Market', id: 'USR003', type: 'Provider' },
    rating: 5,
    content:
      'Excellent partner for our food bank. They consistently provide high-quality donations that help many families in need.',
    date: '2023-08-07',
    status: 'Published',
    flagged: false,
  },
  {
    id: 'REV005',
    reviewer: { name: 'Sarah Williams', id: 'USR009' },
    subject: { name: 'Local Bakery', id: 'USR008', type: 'Provider' },
    rating: 1,
    content:
      'Terrible experience. The bread was stale and the service was rude. Would not recommend to anyone!',
    date: '2023-08-06',
    status: 'Under Review',
    flagged: true,
    flagReason: 'Reported for potentially false information',
  },
]

const Reviews = () => {
  const [reviews, setReviews] = useState(mockReviews)
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedReview, setSelectedReview] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.reviewer.name.toLowerCase().includes(search.toLowerCase()) ||
      review.subject.name.toLowerCase().includes(search.toLowerCase()) ||
      review.content.toLowerCase().includes(search.toLowerCase())

    const matchesRating =
      ratingFilter === 'All' || review.rating.toString() === ratingFilter

    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Flagged'
        ? review.flagged
        : review.status === statusFilter

    return matchesSearch && matchesRating && matchesStatus
  })

  const handleViewReview = (review) => {
    setSelectedReview(review)
    setShowReviewModal(true)
  }

  const handleConfirmAction = (type, reviewId) => {
    setConfirmAction({ type, reviewId })
    setShowConfirmModal(true)
  }

  const executeAction = () => {
    if (!confirmAction) return
    const { type, reviewId } = confirmAction

    if (type === 'approve') {
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? { ...review, status: 'Published', flagged: false }
            : review
        )
      )
      toast.success(`Review ${reviewId} has been approved and published`)
    } else if (type === 'remove') {
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? { ...review, status: 'Removed' }
            : review
        )
      )
      toast.success(`Review ${reviewId} has been removed`)
    } else if (type === 'flag') {
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                status: 'Under Review',
                flagged: true,
                flagReason: 'Flagged by administrator for review',
              }
            : review
        )
      )
      toast.success(`Review ${reviewId} has been flagged for review`)
    }

    setShowConfirmModal(false)
    setConfirmAction(null)
    setShowReviewModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-500">Manage user reviews and ratings</p>
      </div>
      <ReviewFilters
        search={search}
        setSearch={setSearch}
        ratingFilter={ratingFilter}
        setRatingFilter={setRatingFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <ReviewTable
        reviews={filteredReviews}
        onViewReview={handleViewReview}
        onActionClick={handleConfirmAction}
      />
      {showReviewModal && selectedReview && (
        <ReviewModal
          review={selectedReview}
          onClose={() => setShowReviewModal(false)}
          onApprove={(id) => handleConfirmAction('approve', id)}
          onRemove={(id) => handleConfirmAction('remove', id)}
          onFlag={(id) => handleConfirmAction('flag', id)}
        />
      )}
      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'approve'
              ? 'Approve Review'
              : confirmAction.type === 'remove'
              ? 'Remove Review'
              : 'Flag Review'
          }
          message={
            confirmAction.type === 'approve'
              ? 'Are you sure you want to approve this review? It will be published and visible to all users.'
              : confirmAction.type === 'remove'
              ? 'Are you sure you want to remove this review? It will no longer be visible on the platform.'
              : 'Are you sure you want to flag this review? It will be marked for further review.'
          }
          confirmButtonText="Confirm"
          confirmButtonColor={
            confirmAction.type === 'approve'
              ? 'green'
              : confirmAction.type === 'remove'
              ? 'red'
              : 'blue'
          }
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Reviews
