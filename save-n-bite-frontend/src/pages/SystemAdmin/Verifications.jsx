import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'
import VerificationTable from '../../components/SystemAdmin/Verifications/VerificationTable'
import VerificationModal from '../../components/SystemAdmin/Verifications/VerificationModal'
import {
  RefreshCwIcon,
  SearchIcon,
  FilterIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  XIcon
} from 'lucide-react'

const Verifications = () => {
  const [verifications, setVerifications] = useState([])
  const [filteredVerifications, setFilteredVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('Pending')

  // Authentication setup
  useEffect(() => {
    setupAuthAndFetchVerifications()
  }, [])

  const setupAuthAndFetchVerifications = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      await fetchVerifications()
      
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
      setLoading(false)
    }
  }

  /**
   * Fetch verification requests from API
   */
  const fetchVerifications = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching verifications...')
      const response = await AdminAPI.getPendingVerifications()
      
      console.log('Verifications API response:', response)

      if (response.success) {
        console.log('Verifications loaded successfully:', response.data)
        setVerifications(response.data || [])
      } else {
        throw new Error(response.error || 'Failed to fetch verification requests')
      }
      
    } catch (err) {
      console.error('Verifications fetch error:', err)
      setError(err.message || 'Failed to fetch verification requests')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Apply filters to verifications
   */
  useEffect(() => {
    let filtered = [...verifications]

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(verification =>
        verification.name?.toLowerCase().includes(search.toLowerCase()) ||
        verification.email?.toLowerCase().includes(search.toLowerCase()) ||
        verification.id?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'All Types') {
      filtered = filtered.filter(verification => verification.type === typeFilter)
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending') {
        filtered = filtered.filter(verification => 
          verification.status === 'pending_verification' || verification.status === 'Pending'
        )
      } else if (statusFilter === 'Approved') {
        filtered = filtered.filter(verification => 
          verification.status === 'verified' || verification.status === 'Approved'
        )
      } else if (statusFilter === 'Rejected') {
        filtered = filtered.filter(verification => 
          verification.status === 'rejected' || verification.status === 'Rejected'
        )
      }
    }

    console.log('Filtered verifications:', filtered)
    setFilteredVerifications(filtered)
  }, [verifications, search, typeFilter, statusFilter])

  /**
   * Handle verification status update
   */
  const handleVerificationUpdate = async (verificationId, newStatus, reason = '') => {
    try {
      const verification = verifications.find(v => v.id === verificationId)
      if (!verification) {
        throw new Error('Verification not found')
      }

      console.log('=== VERIFICATION UPDATE DEBUG ===');
      console.log('verificationId:', verificationId);
      console.log('verification object:', verification);
      console.log('newStatus:', newStatus);
      console.log('reason:', reason);
      console.log('verification.type:', verification.type);
      console.log('verification.id:', verification.id);
      console.log('verification.rawProfile:', verification.rawProfile);

      // Try using different possible profile IDs from the verification object
      const possibleProfileId = verification.id || verification.profileId || verificationId;
      
      console.log('Using profile ID:', possibleProfileId);

      // Use the actual profile_id instead of the UserID
      const response = await AdminAPI.updateVerificationStatus(
        verification.type, // 'NGO' or 'Provider'
        verification.rawProfile.profile_id || verification.profileId, // Use profile_id from rawProfile
        newStatus,         // 'Approved' or 'Rejected'
        reason
      )

      console.log('Update response:', response);

      if (response.success) {
        // Refresh verifications after successful update
        await fetchVerifications()
        setShowModal(false)
        setSelectedVerification(null)
        toast.success(`Verification ${newStatus.toLowerCase()} successfully`)
      } else {
        throw new Error(response.error || 'Failed to update verification status')
      }
      
    } catch (err) {
      console.error('Verification update error:', err)
      toast.error('Failed to update verification: ' + err.message)
    }
  }

  /**
   * Handle approve verification
   */
  const handleApprove = (verificationId, reason) => {
    handleVerificationUpdate(verificationId, 'Approved', reason)
  }

  /**
   * Handle reject verification
   */
  const handleReject = (verificationId, reason) => {
    handleVerificationUpdate(verificationId, 'Rejected', reason)
  }

  /**
   * Handle view verification details
   */
  const handleViewVerification = (verification) => {
    setSelectedVerification(verification)
    setShowModal(true)
  }

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    fetchVerifications()
    toast.success('Verification requests refreshed')
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearch('')
    setTypeFilter('All Types')
    setStatusFilter('All')
  }

  const hasActiveFilters = search || typeFilter !== 'All Types' || statusFilter !== 'All'

  // Get verification statistics
  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'pending_verification' || v.status === 'Pending').length,
    approved: verifications.filter(v => v.status === 'verified' || v.status === 'Approved').length,
    rejected: verifications.filter(v => v.status === 'rejected' || v.status === 'Rejected').length,
    ngos: verifications.filter(v => v.type === 'NGO').length,
    providers: verifications.filter(v => v.type === 'Provider').length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>
          <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <RefreshCwIcon className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-500">Loading verification requests...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Verifications</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={setupAuthAndFetchVerifications}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Requests</h1>
          <p className="text-gray-500">Review and process verification requests</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">NGOs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.ngos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Providers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.providers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FilterIcon className="w-5 h-5 mr-2 text-gray-500" />
            Filter Verifications
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <XIcon className="w-4 h-4 mr-1" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by name, email, or ID..."
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="All Types">All Types</option>
              <option value="NGO">NGO</option>
              <option value="Provider">Provider</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Show message if no verifications after filtering */}
      {filteredVerifications.length === 0 && verifications.length > 0 && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12">
          <div className="text-center">
            <FilterIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No verification requests found</h3>
            <p className="text-gray-500">
              No verification requests match your current filters. Try adjusting your search criteria.
            </p>
          </div>
        </div>
      )}

      {/* Show message if no verifications at all */}
      {verifications.length === 0 && !loading && !error && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12">
          <div className="text-center">
            <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No verification requests</h3>
            <p className="text-gray-500">
              There are currently no pending verification requests to review.
            </p>
          </div>
        </div>
      )}

      {/* Verification Table */}
      {filteredVerifications.length > 0 && (
        <VerificationTable
          verifications={filteredVerifications}
          onViewVerification={handleViewVerification}
        />
      )}

      {/* Verification Modal */}
      {showModal && selectedVerification && (
        <VerificationModal
          verification={selectedVerification}
          onClose={() => {
            setShowModal(false)
            setSelectedVerification(null)
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Backend Connection Status */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="flex items-center text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full mr-2 ${!error ? 'bg-green-500' : 'bg-red-500'}`}></div>
          {!error ? 'Connected to verification API' : 'API connection failed'}
        </div>
      </div>
    </div>
  )
}

export default Verifications