import React, { useState, useEffect } from 'react'
import { Search as SearchIcon, Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Package } from 'lucide-react'
import { Button } from '../../components/foodProvider/Button'
import SideBar from '../../components/foodProvider/SideBar'
import donationsAPI from '../../services/DonationsAPI'

function ManageDonations() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processedDonations, setProcessedDonations] = useState(new Set())
  const [stats, setStats] = useState({
    pending: 0,
    ready_for_pickup: 0,
    completed: 0,
    total_donations: 0
  })

  // Fetch donations data
  useEffect(() => {
    fetchDonations()
  }, [])

  const fetchDonations = async () => {
    try {
      setLoading(true)
      const response = await donationsAPI.getIncomingDonationRequests()
      
      if (response.success) {
        // Filter only donation interactions
        const donationInteractions = response.data.interactions?.filter(
          interaction => interaction.type === 'Donation'
        ) || []
        
        setDonations(donationInteractions)
        setStats(response.data.stats || {})
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError('Failed to fetch donation requests')
      console.error('Error fetching donations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptDonation = async (donationId) => {
    try {
      setProcessedDonations(prev => new Set(prev).add(donationId))
      
      const response = await donationsAPI.acceptDonation(donationId)
      
      if (response.success) {
        // Update the donation status locally
        setDonations(prev => 
          prev.map(donation => 
            donation.id === donationId 
              ? { ...donation, status: 'ready_for_pickup' }
              : donation
          )
        )
        alert('Donation request accepted successfully!')
      } else {
        alert(`Failed to accept donation: ${response.error}`)
        setProcessedDonations(prev => {
          const newSet = new Set(prev)
          newSet.delete(donationId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error accepting donation:', error)
      alert('Failed to accept donation request')
      setProcessedDonations(prev => {
        const newSet = new Set(prev)
        newSet.delete(donationId)
        return newSet
      })
    }
  }

  const handleRejectDonation = async (donationId) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    try {
      setProcessedDonations(prev => new Set(prev).add(donationId))
      
      const response = await donationsAPI.rejectDonation(donationId, reason)
      
      if (response.success) {
        // Update the donation status locally
        setDonations(prev => 
          prev.map(donation => 
            donation.id === donationId 
              ? { ...donation, status: 'rejected' }
              : donation
          )
        )
        alert('Donation request rejected successfully!')
      } else {
        alert(`Failed to reject donation: ${response.error}`)
        setProcessedDonations(prev => {
          const newSet = new Set(prev)
          newSet.delete(donationId)
          return newSet
        })
      }
    } catch (error) {
      console.error('Error rejecting donation:', error)
      alert('Failed to reject donation request')
      setProcessedDonations(prev => {
        const newSet = new Set(prev)
        newSet.delete(donationId)
        return newSet
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock size={16} />
      case 'ready_for_pickup':
        return <Package size={16} />
      case 'completed':
        return <CheckCircle size={16} />
      case 'rejected':
        return <XCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const filteredDonations = donations.filter((donation) => {
    const matchesStatus = filterStatus === 'all' || donation.status.toLowerCase() === filterStatus.toLowerCase()
    const matchesSearch = 
      donation.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      donation.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex w-full min-h-screen">
        <SideBar currentPage="donations" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading donation requests...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex w-full min-h-screen">
        <SideBar currentPage="donations" />
        <div className="flex-1 p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              <p className="font-medium">Error loading donations</p>
              <p>{error}</p>
            </div>
            <button
              onClick={fetchDonations}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const pendingCount = donations.filter(d => d.status.toLowerCase() === 'pending').length

  return (
    <div className="flex w-full min-h-screen">
      <SideBar currentPage="donations" pendingCount={pendingCount} />

      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manage Donations</h1>
            <p className="text-gray-600 mt-1">
              Review, approve and track donations to nonprofit organizations
            </p>
          </div>
          <button
            onClick={fetchDonations}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            Refresh
          </button>
        </div>

        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {donations.filter(d => d.status.toLowerCase() === 'pending').length}
              </div>
              <p className="text-sm text-gray-500">Pending Requests</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {donations.filter(d => d.status.toLowerCase() === 'ready_for_pickup').length}
              </div>
              <p className="text-sm text-gray-500">Ready for Pickup</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {donations.filter(d => d.status.toLowerCase() === 'completed').length}
              </div>
              <p className="text-sm text-gray-500">Completed Donations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {donations.reduce((total, donation) => 
                  total + donation.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0
                )}
              </div>
              <p className="text-sm text-gray-500">Items Donated</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by request ID, item, NGO name or email..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Donations List */}
        <div className="bg-white rounded-lg shadow-md">
          {filteredDonations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No donation requests found</p>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDonations.map((donation) => (
                <div key={donation.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                          {getStatusIcon(donation.status)}
                          {donation.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          ID: {donation.id.slice(-8)}
                        </span>
                      </div>

                      {/* NGO Info */}
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">{donation.user.name}</h3>
                        <p className="text-sm text-gray-600">{donation.user.email}</p>
                      </div>

                      {/* Items */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Requested Items:</h4>
                        <div className="space-y-2">
                          {donation.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                              <div>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                  Expires: {new Date(item.expiry_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">Qty: {item.quantity}</span>
                                {item.total_price > 0 && (
                                  <span className="text-sm text-gray-600 block">
                                    Value: R{item.total_price}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {donation.status.toLowerCase() === 'pending' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptDonation(donation.id)}
                            disabled={processedDonations.has(donation.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={16} />
                            {processedDonations.has(donation.id) ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRejectDonation(donation.id)}
                            disabled={processedDonations.has(donation.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle size={16} />
                            {processedDonations.has(donation.id) ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {donation.status.toLowerCase() === 'ready_for_pickup' && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <p className="text-green-800 text-sm font-medium">
                            ✅ Approved - Ready for NGO pickup
                          </p>
                        </div>
                      )}

                      {donation.status.toLowerCase() === 'completed' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                          <p className="text-blue-800 text-sm font-medium">
                            ✅ Completed - Donation picked up on {donation.completed_at ? new Date(donation.completed_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      )}

                      {donation.status.toLowerCase() === 'rejected' && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-red-800 text-sm font-medium">
                            ❌ Request rejected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageDonations