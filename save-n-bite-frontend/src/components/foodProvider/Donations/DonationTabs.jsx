import React, { useState, useContext } from 'react'
import { PendingDonationsTable } from './PendingDonationsTable'
import { ActiveDonationsTable } from './ActiveDonationsTable'
import { CompletedDonationsTable } from './CompletedDonationsTable'
import { ViewDonationRequestModal } from './ViewDonationRequestModal'
import { ThemeContext } from '../../../context/ThemeContext'

export function DonationTabs({ donations }) {
  const [activeTab, setActiveTab] = useState('pending')
  const [activeSubTab, setActiveSubTab] = useState('active')
  const [selectedDonation, setSelectedDonation] = useState(null)
  const { theme } = useContext(ThemeContext)

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-6 py-4 text-sm font-medium focus:outline-none ${
            activeTab === 'pending'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Donation Requests
          {pendingDonations.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 rounded-full">
              {pendingDonations.length}
            </span>
          )}
        </button>
        <button
          className={`px-6 py-4 text-sm font-medium focus:outline-none ${
            activeTab === 'active-completed'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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
          <div className="flex px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-4 py-2 text-sm font-medium focus:outline-none ${
                activeSubTab === 'active'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
              }`}
              onClick={() => setActiveSubTab('active')}
            >
              Active Donations
              {activeDonations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                  {activeDonations.length}
                </span>
              )}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium focus:outline-none ${
                activeSubTab === 'completed'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
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
