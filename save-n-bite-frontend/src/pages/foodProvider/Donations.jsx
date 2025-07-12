import React, { useState } from 'react'
import { Search as SearchIcon, Calendar as CalendarIcon } from 'lucide-react'
import { DonationTabs } from '../Donations/DonationTabs'
import { Button } from '../Button'
import { donationRequestsData } from '../../../utils/MockData'
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
 
  const ngoOptions = Array.from(
    new Set(donationRequestsData.map((donation) => donation.ngoName)),
  )
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Manage Donations</h1>
          <p className="text-gray-600 mt-1">
            Review, approve and track donations to nonprofit organizations
          </p>
        </div>
      </div>
      {/* Donation Statistics Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {
                donationRequestsData.filter(
                  (donation) => donation.status === 'Pending',
                ).length
              }
            </div>
            <p className="text-sm text-gray-500">Pending Requests</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {
                donationRequestsData.filter(
                  (donation) => donation.status === 'Ready for Pickup',
                ).length
              }
            </div>
            <p className="text-sm text-gray-500">Ready for Pickup</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {
                donationRequestsData.filter(
                  (donation) => donation.status === 'Completed',
                ).length
              }
            </div>
            <p className="text-sm text-gray-500">Completed Donations</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {donationRequestsData.filter(
                (donation) => donation.status === 'Completed',
              ).length * 4}{' '}
              kg
            </div>
            <p className="text-sm text-gray-500">Food Waste Saved</p>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by request ID, item or NGO..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={filterNGO}
            onChange={(e) => setFilterNGO(e.target.value)}
          >
            <option value="all">All NGOs</option>
            {ngoOptions.map((ngo) => (
              <option key={ngo} value={ngo}>
                {ngo}
              </option>
            ))}
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="ready for pickup">Ready for Pickup</option>
            <option value="completed">Completed</option>
          </select>
          <Button
            variant="secondary"
            icon={<CalendarIcon className="h-4 w-4" />}
          >
            Date Range
          </Button>
        </div>
      </div>
      <DonationTabs donations={filteredDonations} />
    </div>
  )
}

export default ManageDonations
