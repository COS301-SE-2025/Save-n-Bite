import React, { useState } from 'react'
import { PendingDonationsTable } from './PendingDonationsTable'
import { ActiveDonationsTable } from './ActiveDonationsTable'
import { CompletedDonationsTable } from './CompletedDonationsTable'
import { ViewDonationRequestModal } from './ViewDonationRequestModal'

export function DonationTabs({ donations }) {
  const [activeTab, setActiveTab] = useState('pending')
  const [activeSubTab, setActiveSubTab] = useState('active')
  const [selectedDonation, setSelectedDonation] = useState(null)

  const pendingDonations = donations.filter(
    (donation) => donation.status === 'Pending',
  )
  const activeDonations = donations.filter(
    (donation) => donation.status === 'Ready for Pickup',
  )
  const completedDonations = donations.filter(
    (donation) => donation.status === 'Completed',
  )

  const handleViewRequest = (donation) => {
    setSelectedDonation(donation)
  }

  const handleCloseModal = () => {
    setSelectedDonation(null)
  }

  const handleAcceptRequest = (donationId) => {
    console.log('Accepting donation request:', donationId)
    handleCloseModal()
    alert('Donation request accepted successfully!')
  }

  const handleRejectRequest = (donationId, reason) => {
    console.log('Rejecting donation request:', donationId, 'Reason:', reason)
    handleCloseModal()
    alert('Donation request rejected successfully!')
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex border-b">
        <button
          className={`px-6 py-4 text-sm font-medium ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Donation Requests
          {pendingDonations.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              {pendingDonations.length}
            </span>
          )}
        </button>
        <button
          className={`px-6 py-4 text-sm font-medium ${
            activeTab === 'active-completed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('active-completed')}
        >
          Active & Completed Donations
        </button>
      </div>
      {activeTab === 'pending' ? (
        <PendingDonationsTable
          donations={pendingDonations}
          onViewRequest={handleViewRequest}
        />
      ) : (
        <div>
          <div className="flex px-6 pt-4 border-b">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeSubTab === 'active'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveSubTab('active')}
            >
              Active Donations
              {activeDonations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                  {activeDonations.length}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeSubTab === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveSubTab('completed')}
            >
              Completed Donations
            </button>
          </div>
          {activeSubTab === 'active' ? (
            <ActiveDonationsTable donations={activeDonations} />
          ) : (
            <CompletedDonationsTable donations={completedDonations} />
          )}
        </div>
      )}
      {selectedDonation && (
        <ViewDonationRequestModal
          donation={selectedDonation}
          onClose={handleCloseModal}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />
      )}
    </div>
  )
}
