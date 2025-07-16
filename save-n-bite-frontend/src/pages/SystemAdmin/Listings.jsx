import React, { useState } from 'react'
import { toast } from 'sonner'
import ListingFilters from '../../components/SystemAdmin/Listings/ListingFilters'
import ListingTable from '../../components/SystemAdmin/Listings/ListingTable'
import ListingModal from '../../components/SystemAdmin/Listings/ListingModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'

// Mock data for listings
const mockListings = [
  {
    id: 'LST001',
    name: 'Fresh Vegetables Bundle',
    provider: 'Fresh Harvest Market',
    type: 'Sale',
    price: '$12.99',
    created: '2023-08-10',
    status: 'Active',
    featured: false,
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
    status: 'Active',
    featured: true,
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
    status: 'Active',
    featured: false,
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
    status: 'Flagged',
    featured: false,
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
    status: 'Removed',
    featured: false,
    image:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
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

  const executeAction = () => {
    if (!confirmAction) return
    const { type, listingId } = confirmAction

    if (type === 'remove') {
      setListings(
        listings.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: 'Removed' }
            : listing
        )
      )
      toast.success(`Listing ${listingId} has been removed`)
    } else if (type === 'feature') {
      setListings(
        listings.map((listing) =>
          listing.id === listingId
            ? { ...listing, featured: !listing.featured }
            : listing
        )
      )
      const listing = listings.find((l) => l.id === listingId)
      toast.success(
        `Listing ${listingId} has been ${listing?.featured ? 'unfeatured' : 'featured'}`
      )
    }

    setShowConfirmModal(false)
    setConfirmAction(null)
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
          onRemove={(id) => handleConfirmAction('remove', id)}
          onFeature={(id) => handleConfirmAction('feature', id)}
        />
      )}

      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'remove'
              ? 'Remove Listing'
              : listings.find((l) => l.id === confirmAction.listingId)?.featured
              ? 'Unfeature Listing'
              : 'Feature Listing'
          }
          message={
            confirmAction.type === 'remove'
              ? 'Are you sure you want to remove this listing? It will no longer be visible to users.'
              : listings.find((l) => l.id === confirmAction.listingId)?.featured
              ? 'Are you sure you want to unfeature this listing? It will no longer appear in featured sections.'
              : 'Are you sure you want to feature this listing? It will appear in featured sections of the platform.'
          }
          confirmButtonText="Confirm"
          confirmButtonColor={confirmAction.type === 'remove' ? 'red' : 'blue'}
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Listings
