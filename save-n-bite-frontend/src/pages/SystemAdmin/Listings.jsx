import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import ListingFilters from '../../components/SystemAdmin/Listings/ListingFilters'
import ListingTable from '../../components/SystemAdmin/Listings/ListingTable'
import ListingModal from '../../components/SystemAdmin/Listings/ListingModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'

const Listings = () => {
  const [listings, setListings] = useState([]) //start with empty array
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  //exsisitng UI state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedListing, setSelectedListing] = useState(null)
  const [showListingModal, setShowListingModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

    useEffect(() => {
      setupAuthAndFetchlistings()
    }, [])
  
    const setupAuthAndFetchlistings = async () => {
      try {
        // STEP 3A: Set up authentication (same pattern as dashboard/verifications)
        const token = localStorage.getItem('adminToken')
        if (!token) {
          throw new Error('No admin token found. Please log in again.')
        }
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // STEP 3B: Fetch the actual data
        await getListings()
        
      } catch (error) {
        console.error('Authentication setup error:', error)
        setError('Authentication failed. Please log in again.')
        setLoading(false)
      }
    }

//New function to get listings and populate:
const getListings = async () => {
  try {
    setLoading(true);

    const response = await AdminAPI.getAllListings(1, '', 'All', 'All', 20)

    if(response.success){
      setListings(response.data.listings)
      setError(null)
    } else {
      console.log('Error fetching listings data: ', response.error)
      setError(response.error)
      toast.error(response.error || 'Failed to load listing')
    }
  } catch (error){
      console.error('listings fetch error:', error)
          
      //Handle different error types
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.')
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.')
      } else {
          setError('Failed to fetch listings')
      }
          
      toast.error('Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  //UR OVER HERE !!!efq#($y!g$(346247@#)r@#)))



  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.name.toLowerCase().includes(search.toLowerCase()) ||
      listing.provider.toLowerCase().includes(search.toLowerCase()) ||
      listing.id.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'All' || listing.type === typeFilter
    const matchesStatus =
      statusFilter === 'All' || listing.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const handleViewListing = (listing) => {
    setSelectedListing(listing)
    setShowListingModal(true)
  }

  const handleConfirmAction = (type, listingId) => {
    setConfirmAction({ type, listingId })
    setShowConfirmModal(true)
  }

  const handleFlag = (listingId, flagReason) => {
    setConfirmAction({
      type: 'flag',
      listingId,
      reason: flagReason,
    })
    setShowConfirmModal(true)
  }

  const handleRemove = (listingId, removeReason) => {
    setConfirmAction({
      type: 'remove',
      listingId,
      reason: removeReason,
    })
    setShowConfirmModal(true)
  }

  const executeAction = () => {
    if (!confirmAction) return
    
    const { type, listingId, reason } = confirmAction

    if (type === 'remove') {
      setListings(
        listings.map((listing) =>
          listing.id === listingId
            ? { 
                ...listing, 
                status: 'removed',
                reason: reason || 'No reason provided'
              }
            : listing
        )
      )
      toast.success(`Listing ${listingId} has been removed`)
    } else if (type === 'flag') {
      setListings(
        listings.map((listing) =>
          listing.id === listingId
            ? { 
                ...listing, 
                status: 'flagged',
                reason: reason || 'No reason provided'
              }
            : listing
        )
      )
      toast.success(`Listing ${listingId} has been flagged for review`)
    }

    setShowConfirmModal(false)
    setConfirmAction(null)
    setShowListingModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Food Listings</h1>
        <p className="text-gray-500">Manage all food listings on the platform</p>
      </div>

      <ListingFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <ListingTable
        listings={filteredListings}
        onViewListing={handleViewListing}
        onActionClick={handleConfirmAction}
      />

      {showListingModal && selectedListing && (
        <ListingModal
          listing={selectedListing}
          onClose={() => setShowListingModal(false)}
          onRemove={handleRemove}
          onFlag={handleFlag}
        />
      )}

      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'remove'
              ? 'Remove Listing'
              : 'Flag Listing'
          }
          message={
            confirmAction.type === 'remove'
              ? 'Are you sure you want to remove this listing? It will no longer be visible to listings.'
              : 'Are you sure you want to flag this listing? It will be marked for review and may be hidden from listings.'
          }
          confirmButtonText="Confirm"
          confirmButtonColor={confirmAction.type === 'remove' ? 'red' : 'amber'}
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Listings