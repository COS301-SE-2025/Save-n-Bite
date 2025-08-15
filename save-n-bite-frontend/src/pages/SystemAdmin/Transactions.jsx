import React, { useState, useEffect } from 'react'
import TransactionFilters from '../../components/SystemAdmin/Transactions/TransactionFilters'
import TransactionTable from '../../components/SystemAdmin/Transactions/TransactionTable'
import TransactionModal from '../../components/SystemAdmin/Transactions/TransactionModal'
import AdminAPI from '../../services/AdminAPI'
import { apiClient } from '../../services/FoodAPI.js'


const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  //unchanged existing UI state
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  //add authentication and data fetching 
  useEffect(() => {
    setupAuthAndFetchTransactions()
  }, [])
  
  const setupAuthAndFetchTransactions = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      if (!token) {
        throw new Error('No admin token found. Please log in again.')
      }
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
      await fetchTransactions()
        
    } catch (error) {
      console.error('Authentication setup error:', error)
      setError('Authentication failed. Please log in again.')
      setLoading(false)
    }
  }

    const fetchTransactions = async () => {
    try {
      setLoading(true)
      console.log('Fetching transactions from API...')
      
      const response = await AdminAPI.getAllTransactions(1, '', 'All', 'All', 20) 
      
      if (response.success) {
        setTransactions(response.data.transactions)
        setError(null)
        console.log('Transactions loaded successfully:', response.data.transactions.length, 'transactions')
      } else {
        console.error('Transactions API error:', response.error)
        setError(response.error)
        toast.error(response.error || 'Failed to load transactions')
      }
    } catch (error) {
      console.error('Transactions fetch error:', error)
      
      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.')
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
      } else if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.')
      } else {
        setError('Failed to fetch transactions')
      }
      
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  // 🔧 FIX: Add loading state guard
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        </div>
        
        {/* Filters skeleton */}
        <div className="bg-white p-4 rounded-lg shadow animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow animate-pulse">
          <div className="p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4 border-b">
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 🔧 FIX: Add error state guard
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Transactions</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={fetchTransactions}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 🔧 FIX: Make filtering safer with optional chaining
  const filteredTransactions = (transactions || []).filter((transaction) => {
    const matchesSearch =
      transaction.id?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.provider?.name?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.consumer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      transaction.item?.toLowerCase().includes(search.toLowerCase())

    const matchesType = typeFilter === 'All' || transaction.type === typeFilter
    const matchesStatus = statusFilter === 'All' || transaction.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500">
          Monitor platform transactions and activity
        </p>
      </div>


      <TransactionFilters
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <TransactionTable
        transactions={filteredTransactions}
        onViewTransaction={handleViewTransaction}
      />

      {showTransactionModal && selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  )
}

export default Transactions