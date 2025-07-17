import React, { useState } from 'react'
import TransactionFilters from '../../components/SystemAdmin/Transactions/TransactionFilters'
import TransactionTable from '../../components/SystemAdmin/Transactions/TransactionTable'
import TransactionModal from '../../components/SystemAdmin/Transactions/TransactionModal'

// Updated mock data with correct backend status values from Interactions service contract
const mockTransactions = [
  {
    id: 'TRX001',
    type: 'Sale',
    provider: {
      name: 'Fresh Harvest Market',
      id: 'USR003',
    },
    consumer: {
      name: 'John Smith',
      id: 'USR001',
    },
    item: 'Fresh Vegetables Bundle',
    amount: 'R12.99',
    date: '2023-08-10',
    status: 'completed',
  },
  {
    id: 'TRX002',
    type: 'Donation',
    provider: {
      name: 'Local Bakery',
      id: 'USR008',
    },
    consumer: {
      name: 'Food Rescue NGO',
      id: 'USR004',
    },
    item: 'Bread and Pastries',
    amount: 'Free',
    date: '2023-08-09',
    status: 'completed',
  },
  {
    id: 'TRX003',
    type: 'Sale',
    provider: {
      name: 'Green Grocers',
      id: 'USR005',
    },
    consumer: {
      name: 'Jane Doe',
      id: 'USR002',
    },
    item: 'Canned Goods Assortment',
    amount: 'R8.50',
    date: '2023-08-08',
    status: 'ready_for_pickup',
  },
  {
    id: 'TRX004',
    type: 'Sale',
    provider: {
      name: 'Fresh Harvest Market',
      id: 'USR003',
    },
    consumer: {
      name: 'Alex Johnson',
      id: 'USR007',
    },
    item: 'Prepared Meals - 5 Pack',
    amount: 'R24.99',
    date: '2023-08-07',
    status: 'cancelled',
    dispute: {
      reason: 'Customer requested cancellation due to dietary restrictions',
      date: '2023-08-08',
      status: 'Resolved',
    },
  },
  {
    id: 'TRX005',
    type: 'Donation',
    provider: {
      name: 'Green Grocers',
      id: 'USR005',
    },
    consumer: {
      name: 'Community Food Bank',
      id: 'USR006',
    },
    item: 'Fruits Assortment',
    amount: 'Free',
    date: '2023-08-06',
    status: 'rejected',
    dispute: {
      reason: 'Provider unable to fulfill donation request due to capacity',
      date: '2023-08-06',
      status: 'Closed',
    },
  },
  {
    id: 'TRX006',
    type: 'Sale',
    provider: {
      name: 'City Market',
      id: 'USR011',
    },
    consumer: {
      name: 'Sarah Williams',
      id: 'USR009',
    },
    item: 'Organic Produce Box',
    amount: 'R45.00',
    date: '2023-08-05',
    status: 'preparing',
  },
  {
    id: 'TRX007',
    type: 'Donation',
    provider: {
      name: 'Fresh Harvest Market',
      id: 'USR003',
    },
    consumer: {
      name: 'Hunger Relief NGO',
      id: 'USR012',
    },
    item: 'Mixed Vegetables',
    amount: 'Free',
    date: '2023-08-04',
    status: 'confirmed',
  },
  {
    id: 'TRX008',
    type: 'Sale',
    provider: {
      name: 'University Cafeteria',
      id: 'USR013',
    },
    consumer: {
      name: 'Mike Chen',
      id: 'USR014',
    },
    item: 'Lunch Combo',
    amount: 'R18.50',
    date: '2023-08-03',
    status: 'expired',
    dispute: {
      reason: 'Order not collected within pickup window',
      date: '2023-08-03',
      status: 'Auto-resolved',
    },
  },
  {
    id: 'TRX009',
    type: 'Sale',
    provider: {
      name: 'Corner Deli',
      id: 'USR015',
    },
    consumer: {
      name: 'Lisa Park',
      id: 'USR016',
    },
    item: 'Sandwich & Drink',
    amount: 'R15.75',
    date: '2023-08-02',
    status: 'pending',
  },
]

const Transactions = () => {
  const [transactions] = useState(mockTransactions)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(search.toLowerCase()) ||
      transaction.provider.name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.consumer.name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.item.toLowerCase().includes(search.toLowerCase())

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