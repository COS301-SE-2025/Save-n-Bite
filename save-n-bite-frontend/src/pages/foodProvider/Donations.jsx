import React, { useState } from 'react'
import { Search as SearchIcon, Calendar as CalendarIcon } from 'lucide-react'
import { DonationTabs } from '../../components/foodProvider/Donations/DonationTabs'
import { Button } from '../../components/foodProvider/Button'
import { donationRequestsData } from '../../utils/MockData'
import SideBar from '../../components/foodProvider/SideBar'

function ManageDonations() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterNGO, setFilterNGO] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredDonations = donationRequestsData.filter((donation) => {
    const matchesNGO =
      filterNGO === 'all' ||
      donation.ngoName.toLowerCase() === filterNGO.toLowerCase()
    const matchesStatus =
      filterStatus === 'all' ||
      donation.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch =
      donation.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.ngoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.requestId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesNGO && matchesStatus && matchesSearch
  })

  const pendingCount = donationRequestsData.filter(
    (donation) => donation.status.toLowerCase() === 'pending'
  ).length

  return (
    <div className="flex w-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <SideBar currentPage="donations" pendingCount={pendingCount} />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Manage Donations
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Review, approve and track donations to nonprofit organizations
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 transition-colors duration-300">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {pendingCount}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Pending Requests</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {
                  donationRequestsData.filter(
                    (donation) => donation.status === 'Ready for Pickup'
                  ).length
                }
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Ready for Pickup</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {
                  donationRequestsData.filter(
                    (donation) => donation.status === 'Completed'
                  ).length
                }
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Completed Donations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {
                  donationRequestsData.filter(
                    (donation) => donation.status === 'Completed'
                  ).length * 4
                }{' '}
                kg
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300">Food Waste Saved</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by request ID, item or NGO..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              value={filterNGO}
              onChange={(e) => setFilterNGO(e.target.value)}
            >
              <option value="all">All NGOs</option>
              {/* Add more NGO options here if needed */}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="ready for pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <DonationTabs donations={filteredDonations} />
      </div>
    </div>
  )
}

export default ManageDonations
