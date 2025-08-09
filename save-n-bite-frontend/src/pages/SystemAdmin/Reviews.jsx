import React, { useState, useEffect } from 'react'
import ReviewFilters from '../../components/SystemAdmin/Reviews/ReviewFilters'
import ReviewTable from '../../components/SystemAdmin/Reviews/ReviewTable'
import ReviewModal from '../../components/SystemAdmin/Reviews/ReviewModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'


const Reviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  //exisiting UI state
  const [search, setSearch] = useState('')
  const [ratingFilter, setRatingFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedReview, setSelectedReview] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  useEffect(() => {
    setupAuthAndFetchReviews()
  }, [])
  
  const setupAuthAndFetchReviews = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        await fetchReviews()
        
      } catch (error) {
        console.error('Authentication setup error:', error)
        setError('Authentication failed. Please log in again.')
        setLoading(false)
    }
  }

  //new function to fetrch reviews from API
  const fetchReviews = async () => {
    try {
      setLoading(true)
      console.log('Fetching reviews from API...')
      
      // STEP 4A: Call our AdminAPI service (which calls /api/admin/reviews/)
      const response = await AdminAPI.getAllReviews(1, '', 'All', 'All', 20) 
      //console.log('reviews API response:', response)
      
      if (response.success) {
        // STEP 4B: Store the real data
        setReviews(response.data.reviews)
        setError(null)
        console.log('reviews loaded successfully:', response.data.reviews.length, 'revies')
      } else {
        console.error('reviews API error:', response.error)
        setError(response.error)
        toast.error(response.error || 'Failed to load reviews')
      }
    } catch (error) {
      console.error('reviews fetch error:', error)
      
      // STEP 4C: Handle different error types
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.')
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.')
      } else {
        setError('Failed to fetch reviews')
      }
      
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
      </div>
      {/* Add loading skeleton */}
    </div>
  )
}

if (error) {
  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-red-800">Error Loading Reviews</h3>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <button onClick={fetchReviews} className="mt-2 text-sm text-red-600 hover:text-red-500 underline">
          Try Again
        </button>
      </div>
    </div>
  )
}

const filteredReviews = (reviews || []).filter((review) => {
  const matchesSearch =
    review.reviewer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    review.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
    review.content?.toLowerCase().includes(search.toLowerCase())

  const matchesRating =
    ratingFilter === 'All' || review.rating?.toString() === ratingFilter

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

const executeAction = async () => {
  if (!confirmAction) return
  
  const { type, reviewId, reason } = confirmAction

  try {
    //console.log('Processing review action:', type, reviewId, reason)

    // Call the real API
    const response = await AdminAPI.moderateReview(reviewId, type, reason)

    if (response.success) {
      // Update local state after successful API call
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
    } else {
      toast.error(response.error || `Failed to ${type} review`)
    }
  } catch (error) {
    //console.error('Error executing review action:', error)
    toast.error(`Failed to ${type} review`)
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
              ? 'Are you sure you want to flag this review? It will be marked for further review and may be hidden from reviews.'
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