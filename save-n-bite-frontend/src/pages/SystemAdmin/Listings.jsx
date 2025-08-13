import React, { useState } from 'react'
import { toast } from 'sonner'
import ListingFilters from '../../components/SystemAdmin/Listings/ListingFilters'
import ListingTable from '../../components/SystemAdmin/Listings/ListingTable'
import ListingModal from '../../components/SystemAdmin/Listings/ListingModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'

// Updated mock data with correct backend status values
const mockListings = [
  {
    id: 'LST001',
    name: 'Fresh Vegetables Bundle',
    provider: 'Fresh Harvest Market',
    type: 'Sale',
    price: '$12.99',
    created: '2023-08-10',
    status: 'active',
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'LST002',
    name: 'Bread and Pastries',
    provider: 'Local Bakery',
    type: 'Donation',
    price: 'Free',
    created: '2023-08-09',
    status: 'active',
    image:
      'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'LST003',
    name: 'Canned Goods Assortment',
    provider: 'Green Grocers',
    type: 'Sale',
    price: '$8.50',
    created: '2023-08-08',
    status: 'active',
    image:
      'https://images.unsplash.com/photo-1584263347416-85a696b4eda7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'LST004',
    name: 'Prepared Meals - 5 Pack',
    provider: 'Fresh Harvest Market',
    type: 'Sale',
    price: '$24.99',
    created: '2023-08-07',
    status: 'flagged',
    reason: 'Suspicious pricing - significantly overpriced for expired items',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'LST005',
    name: 'Fruits Assortment',
    provider: 'Green Grocers',
    type: 'Donation',
    price: 'Free',
    created: '2023-08-06',
    status: 'removed',
    reason: 'Inappropriate content in listing description',
    image:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'LST006',
    name: 'Dairy Products Mix',
    provider: 'City Supermarket',
    type: 'Sale',
    price: '$15.50',
    created: '2023-08-05',
    status: 'sold_out',
    image:
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
  },
  {
    id: 'LST007',
    name: 'Frozen Meals Pack',
    provider: 'Quick Mart',
    type: 'Sale',
    price: '$18.99',
    created: '2023-08-04',
    status: 'expired',
    image:
      'https://images.unsplash.com/photo-1574781330855-d0db2706b3d0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
  },
]

const Listings = () => {
  const [listings, setListings] = useState(mockListings)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedListing, setSelectedListing] = useState(null)
  const [showListingModal, setShowListingModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

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
              ? 'Are you sure you want to remove this listing? It will no longer be visible to users.'
              : 'Are you sure you want to flag this listing? It will be marked for review and may be hidden from users.'
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