import React, { useState, useEffect } from 'react'
import { Search as SearchIcon, Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Package, Menu, ArrowRight, Check } from 'lucide-react'
import { Button } from '../../components/foodProvider/Button'
import SideBar from '../../components/foodProvider/SideBar'
import { Toast } from '../../components/ui/Toast'
import donationsAPI from '../../services/DonationsAPI'

function ManageDonations() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processedDonations, setProcessedDonations] = useState(new Set())
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [selectedDonationId, setSelectedDonationId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [stats, setStats] = useState({
    pending: 0,
    ready_for_pickup: 0,
    completed: 0,
    total_donations: 0
  })

  // Toast helper function
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadOrdersData();
        loadReviewsData();
      }
    };
    const onFocus = () => {
      loadOrdersData();
      loadReviewsData();
    };
  
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
  
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Fetch donations data
  useEffect(() => {
    fetchDonations();
    const interval = setInterval(fetchDonations, 30000); 
    return () => clearInterval(interval);
  }, []);

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

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const openRejectModal = (donationId) => {
    setSelectedDonationId(donationId)
    setRejectionReason('')
    setRejectionModalOpen(true)
  }

  const closeRejectModal = () => {
    setRejectionModalOpen(false)
    setSelectedDonationId(null)
    setRejectionReason('')
  }

  const handleAcceptDonation = async (donationId) => {
    try {
      setProcessedDonations(prev => new Set(prev).add(donationId))
      
      const response = await donationsAPI.acceptDonation(donationId)
      
      if (response.success) {
        // Update the donation status locally to confirmed
        setDonations(prev => 
          prev.map(donation => 
            donation.id === donationId 
              ? { ...donation, status: 'confirmed' }
              : donation
          )
        )
        showToast('Donation request accepted and confirmed!', 'success')
      } else {
        showToast(`Failed to accept donation: ${response.error}`, 'error')
      }
    } catch (error) {
      console.error('Error accepting donation:', error)
      showToast('Failed to accept donation request', 'error')
    } finally {
      setProcessedDonations(prev => {
        const newSet = new Set(prev)
        newSet.delete(donationId)
        return newSet
      })
    }
  }

  const handlePrepareDonation = async (donationId) => {
    try {
      setProcessedDonations(prev => new Set(prev).add(donationId))
      
      const response = await donationsAPI.prepareDonation(donationId, 'Donation prepared for pickup')
      
      if (response.success) {
        // Update the donation status locally to ready_for_pickup
        setDonations(prev => 
          prev.map(donation => 
            donation.id === donationId 
              ? { ...donation, status: 'ready_for_pickup' }
              : donation
          )
        )
        showToast('Donation marked as ready for pickup!', 'success')
      } else {
        showToast(`Failed to prepare donation: ${response.error}`, 'error')
      }
    } catch (error) {
      console.error('Error preparing donation:', error)
      showToast('Failed to prepare donation', 'error')
    } finally {
      setProcessedDonations(prev => {
        const newSet = new Set(prev)
        newSet.delete(donationId)
        return newSet
      })
    }
  }

  const handleCompleteDonation = async (donationId) => {
    try {
      setProcessedDonations(prev => new Set(prev).add(donationId))
      
      const response = await donationsAPI.completeDonation(donationId, {
        completion_notes: 'Donation pickup completed successfully'
      })
      
      if (response.success) {
        // Update the donation status locally to completed
        setDonations(prev => 
          prev.map(donation => 
            donation.id === donationId 
              ? { ...donation, status: 'completed', completed_at: response.data.completed_at }
              : donation
          )
        )
        showToast('Donation pickup completed successfully!', 'success')
      } else {
        showToast(`Failed to complete donation: ${response.error}`, 'error')
      }
    } catch (error) {
      console.error('Error completing donation:', error)
      showToast('Failed to complete donation', 'error')
    } finally {
      setProcessedDonations(prev => {
        const newSet = new Set(prev)
        newSet.delete(donationId)
        return newSet
      })
    }
  }

  const handleRejectDonation = async () => {
    if (!selectedDonationId) return
    
    try {
      setProcessedDonations(prev => new Set(prev).add(selectedDonationId))
      
      const response = await donationsAPI.rejectDonation(selectedDonationId, rejectionReason || 'No reason provided')
      
      if (response.success) {
        // Update the donation status locally
        setDonations(prev => 
          prev.map(donation => 
            donation.id === selectedDonationId 
              ? { ...donation, status: 'rejected' }
              : donation
          )
        )
        showToast('Donation request rejected successfully!', 'success')
      } else {
        showToast(`Failed to reject donation: ${response.error}`, 'error')
      }
    } catch (error) {
      console.error('Error rejecting donation:', error)
      showToast('Failed to reject donation request', 'error')
    } finally {
      closeRejectModal()
      setProcessedDonations(prev => {
        const newSet = new Set(prev)
        newSet.delete(selectedDonationId)
        return newSet
      })
    }
  }

  const getStatusColor = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
    switch (normalizedStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700'
      case 'ready':
      case 'readyforpickup':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-700'
    }
  }

  const getStatusIcon = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
    switch (normalizedStatus) {
      case 'pending':
        return <Clock size={16} />
      case 'confirmed':
        return <Check size={16} />
      case 'ready':
      case 'readyforpickup':
        return <Package size={16} />
      case 'completed':
        return <CheckCircle size={16} />
      case 'rejected':
        return <XCircle size={16} />
      default:
        return <Clock size={16} />
    }
  }

  const getStatusText = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
    switch (normalizedStatus) {
      case 'pending':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'ready':
      case 'readyforpickup':
        return 'Ready for Pickup'
      case 'completed':
        return 'Completed'
      case 'rejected':
        return 'Rejected'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    }
  }

  const isReadyForPickup = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
    return normalizedStatus === 'ready' || normalizedStatus === 'readyforpickup';
  }

  const filteredDonations = donations.filter((donation) => {
    const normalizedStatus = donation.status.toLowerCase().replace(/[_\s]/g, '');
    const normalizedFilter = filterStatus.toLowerCase().replace(/[_\s]/g, '');
    
    const matchesStatus = filterStatus === 'all' || 
                         normalizedStatus === normalizedFilter ||
                         (normalizedFilter === 'readyforpickup' && (normalizedStatus === 'ready' || normalizedStatus === 'readyforpickup'));
    
    const matchesSearch = 
      donation.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      donation.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donation.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex w-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <SideBar currentPage="donations" />
        </div>
        <div className="flex-1 p-4 sm:p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading donation requests...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex w-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <SideBar currentPage="donations" />
        </div>
        <div className="flex-1 p-4 sm:p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4">
            <div className="text-red-800 dark:text-red-300">
              <p className="font-medium">Error loading donations</p>
              <p>{error}</p>
            </div>
            <button
              onClick={fetchDonations}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-md transition-colors"
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
    <div className="relative">
      <div className="flex w-full min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="hidden md:flex">
          <SideBar 
            currentPage="donations" 
            pendingCount={pendingCount}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={toggleMobileSidebar}
            />
            {/* Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 z-50">
              <SideBar 
                currentPage="donations" 
                pendingCount={pendingCount}
                onNavigate={() => setIsMobileSidebarOpen(false)}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <button
              onClick={toggleMobileSidebar}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Donations {pendingCount > 0 && <span className="text-sm bg-red-500 text-white px-2 py-1 rounded-full ml-2">{pendingCount}</span>}
            </h1>
            
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
              <div>
                <h1 className="hidden md:block text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Donations</h1>
                <h2 className="md:hidden text-xl font-bold text-gray-900 dark:text-gray-100">Donations</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm sm:text-base">
                  Review, approve and track donations to nonprofit organizations
                </p>
              </div>
             
            </div>

            {/* Stats Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-6">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {donations.filter(d => d.status.toLowerCase() === 'pending').length}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Pending</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {donations.filter(d => d.status.toLowerCase() === 'confirmed').length}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Confirmed</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {donations.filter(d => isReadyForPickup(d.status)).length}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Ready</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {donations.filter(d => d.status.toLowerCase() === 'completed').length}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
                    {donations.filter(d => d.status.toLowerCase() === 'rejected').length}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Rejected</p>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {donations.reduce((total, donation) => 
                      total + donation.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0), 0
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">Items</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 sm:h-5 sm:w-5" />
                  <input
                    type="text"
                    placeholder="Search by ID, item, NGO name..."
                    className="pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md w-full text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-md text-sm sm:text-base sm:min-w-[140px] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending ({donations.filter(d => d.status.toLowerCase() === 'pending').length})</option>
                  <option value="confirmed">Confirmed ({donations.filter(d => d.status.toLowerCase() === 'confirmed').length})</option>
                  <option value="ready_for_pickup">Ready ({donations.filter(d => isReadyForPickup(d.status)).length})</option>
                  <option value="completed">Completed ({donations.filter(d => d.status.toLowerCase() === 'completed').length})</option>
                  <option value="rejected">Rejected ({donations.filter(d => d.status.toLowerCase() === 'rejected').length})</option>
                </select>
              </div>
            </div>

            {/* Donations List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              {filteredDonations.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <Package size={40} className="sm:w-12 sm:h-12 mx-auto mb-4 opacity-50 text-gray-500 dark:text-gray-400" />
                  <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-300">No donation requests found</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDonations.map((donation) => (
                    <div key={donation.id} className="p-4 sm:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                            <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(donation.status)}`}>
                              {getStatusIcon(donation.status)}
                              <span className="hidden sm:inline">{getStatusText(donation.status)}</span>
                              <span className="sm:hidden">{getStatusText(donation.status).split(' ')[0]}</span>
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {new Date(donation.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              ID: {donation.id.slice(-6)}
                            </span>
                          </div>

                          {/* NGO Info */}
                          <div className="mb-3">
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">{donation.user.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{donation.user.email}</p>
                          </div>

                          {/* Items */}
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm sm:text-base">Requested Items:</h4>
                            <div className="space-y-2">
                              {donation.items.map((item, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                                    <div>
                                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{item.name}</span>
                                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 block sm:inline sm:ml-2">
                                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="text-left sm:text-right">
                                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Qty: {item.quantity}</span>
                                      {item.total_price > 0 && (
                                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 block">
                                          Value: R{item.total_price}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Buttons - styled like PickupCoordination */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                              {donation.status.toLowerCase() === 'pending' && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleAcceptDonation(donation.id)}
                                    disabled={processedDonations.has(donation.id)}
                                    className="text-sm"
                                  >
                                    {processedDonations.has(donation.id) ? 'Processing...' : 'Accept Request'}
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => openRejectModal(donation.id)}
                                    disabled={processedDonations.has(donation.id)}
                                    className="text-sm"
                                  >
                                    {processedDonations.has(donation.id) ? 'Processing...' : 'Reject Request'}
                                  </Button>
                                </div>
                              )}

                              {donation.status.toLowerCase() === 'confirmed' && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                  <div className={`px-3 py-2 rounded-md flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300`}>
                                    <span className="text-sm font-medium">Donation confirmed - prepare for pickup</span>
                                  </div>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handlePrepareDonation(donation.id)}
                                    disabled={processedDonations.has(donation.id)}
                                    className="text-sm"
                                  >
                                    {processedDonations.has(donation.id) ? 'Processing...' : 'Mark as Ready'}
                                  </Button>
                                </div>
                              )}

                              {isReadyForPickup(donation.status) && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                                  <div className={`px-3 py-2 rounded-md flex items-center bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300`}>
                                    <span className="text-sm font-medium">Ready for NGO pickup</span>
                                  </div>
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleCompleteDonation(donation.id)}
                                    disabled={processedDonations.has(donation.id)}
                                    className="text-sm"
                                  >
                                    {processedDonations.has(donation.id) ? 'Processing...' : 'Mark as Completed'}
                                  </Button>
                                </div>
                              )}

                              {donation.status.toLowerCase() === 'completed' && (
                                <div className={`px-3 py-2 rounded-md flex items-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300`}>
                                  <span className="text-sm font-medium">
                                    Pickup completed{donation.completed_at ? ` on ${new Date(donation.completed_at).toLocaleDateString()}` : ''}
                                  </span>
                                </div>
                              )}

                              {donation.status.toLowerCase() === 'rejected' && (
                                <div className={`px-3 py-2 rounded-md flex items-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300`}>
                                  <span className="text-sm font-medium">Request rejected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Component */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Reject Donation</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You can provide an optional reason for rejecting this donation request.
            </p>
            <textarea
              className="w-full p-2 border rounded-md mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="3"
              placeholder="Reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={closeRejectModal}
                disabled={processedDonations.has(selectedDonationId)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectDonation}
                disabled={processedDonations.has(selectedDonationId)}
              >
                {processedDonations.has(selectedDonationId) ? 'Processing...' : 'Reject Donation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageDonations