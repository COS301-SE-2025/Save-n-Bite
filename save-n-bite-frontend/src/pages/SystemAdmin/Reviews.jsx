import React, { useState } from 'react'
import ReviewFilters from '../../components/SystemAdmin/Reviews/ReviewFilters'
import ReviewTable from '../../components/SystemAdmin/Reviews/ReviewTable'
import ReviewModal from '../../components/SystemAdmin/Reviews/ReviewModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'

// Updated mock data with correct backend status values
const mockReviews = [
  {
    id: 'REV001',
    reviewer: { name: 'John Smith', id: 'USR001' },
    subject: { name: 'Fresh Harvest Market', id: 'USR003', type: 'Provider' },
    rating: 4,
    content:
      'Great quality food at a reasonable price. The vegetables were fresh and lasted well.',
    date: '2023-08-10',
    status: 'active',
  },
  {
    id: 'REV002',
    reviewer: { name: 'Jane Doe', id: 'USR002' },
    subject: { name: 'Local Bakery', id: 'USR008', type: 'Provider' },
    rating: 5,
    content:
      'Amazing bread and pastries. Everything was delicious and freshly baked!',
    date: '2023-08-09',
    status: 'active',
  },
  {
    id: 'REV003',
    reviewer: { name: 'Alex Johnson', id: 'USR007' },
    subject: { name: 'Green Grocers', id: 'USR005', type: 'Provider' },
    rating: 2,
    content:
      'The produce was not as fresh as advertised. Some items were already going bad when I picked them up.',
    date: '2023-08-08',
    status: 'flagged',
    reason: 'Dispute from provider about accuracy - under investigation',
  },
  {
    id: 'REV004',
    reviewer: { name: 'Community Food Bank', id: 'USR006' },
    subject: { name: 'Fresh Harvest Market', id: 'USR003', type: 'Provider' },
    rating: 5,
    content:
      'Excellent partner for our food bank. They consistently provide high-quality donations that help many families in need.',
    date: '2023-08-07',
    status: 'active',
  },
  {
    id: 'REV005',
    reviewer: { name: 'Sarah Williams', id: 'USR009' },
    subject: { name: 'Local Bakery', id: 'USR008', type: 'Provider' },
    rating: 1,
    content:
      'Terrible experience. The bread was stale and the service was rude. Would not recommend to anyone!',
    date: '2023-08-06',
    status: 'censored',
    reason: 'Contains inappropriate language and personal attacks',
  },
  {
    id: 'REV006',
    reviewer: { name: 'Mike Johnson', id: 'USR010' },
    subject: { name: 'City Market', id: 'USR011', type: 'Provider' },
    rating: 3,
    content:
      'This review contained spam content and fake information about the business.',
    date: '2023-08-05',
    status: 'deleted',
    reason: 'Spam content and misinformation',
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
      statusFilter === 'All' || review.status === statusFilter

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

  const handleFlag = (reviewId, flagReason) => {
    setConfirmAction({
      type: 'flag',
      reviewId,
      reason: flagReason,
    })
    setShowConfirmModal(true)
  }

  const handleDelete = (reviewId, deleteReason) => {
    setConfirmAction({
      type: 'delete',
      reviewId,
      reason: deleteReason,
    })
    setShowConfirmModal(true)
  }

  const executeAction = () => {
    if (!confirmAction) return
    
    const { type, reviewId, reason } = confirmAction

    if (type === 'flag') {
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? { 
                ...review, 
                status: 'flagged',
                reason: reason || 'No reason provided'
              }
            : review
        )
      )
      toast.success(`Review ${reviewId} has been flagged for review`)
    } else if (type === 'delete') {
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? { 
                ...review, 
                status: 'deleted',
                reason: reason || 'No reason provided'
              }
            : review
        )
      )
      toast.success(`Review ${reviewId} has been deleted`)
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
          onFlag={handleFlag}
          onDelete={handleDelete}
        />
      )}
      
      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'flag'
              ? 'Flag Review'
              : 'Delete Review'
          }
          message={
            confirmAction.type === 'flag'
              ? 'Are you sure you want to flag this review? It will be marked for further review and may be hidden from users.'
              : 'Are you sure you want to delete this review? This action cannot be undone and the review will be permanently removed.'
          }
          confirmButtonText="Confirm"
          confirmButtonColor={confirmAction.type === 'flag' ? 'amber' : 'red'}
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Reviews