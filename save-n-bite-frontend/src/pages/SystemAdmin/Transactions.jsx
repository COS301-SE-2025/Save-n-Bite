import React, { useState } from 'react'
import TransactionFilters from '../../components/SystemAdmin/Transactions/TransactionFilters'
import TransactionTable from '../../components/SystemAdmin/Transactions/TransactionTable'
import TransactionModal from '../../components/SystemAdmin/Transactions/TransactionModal'
import ConfirmationModal from '../../components/SystemAdmin/UI/ConfirmationModal'
import { toast } from 'sonner'

// Mock data for transactions
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
    status: 'Completed',
    dispute: null,
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
    status: 'Completed',
    dispute: null,
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
    status: 'In Progress',
    dispute: null,
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
    status: 'Disputed',
    dispute: {
      reason: 'Item quality not as described',
      date: '2023-08-08',
      status: 'Open',
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
    status: 'Cancelled',
    dispute: null,
  },
]

const Transactions = () => {
  const [transactions, setTransactions] = useState(mockTransactions)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(search.toLowerCase()) ||
      transaction.provider.name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.consumer.name.toLowerCase().includes(search.toLowerCase()) ||
      transaction.item.toLowerCase().includes(search.toLowerCase())

    const matchesType = typeFilter === 'All' || transaction.type === typeFilter
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Disputed'
        ? transaction.status === 'Disputed'
        : transaction.status === statusFilter)

    return matchesSearch && matchesType && matchesStatus
  })

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionModal(true)
  }

  const handleConfirmAction = (type, transactionId) => {
    setConfirmAction({ type, transactionId })
    setShowConfirmModal(true)
  }

  const executeAction = () => {
    if (!confirmAction) return
    const { type, transactionId } = confirmAction

    if (type === 'resolve') {
      setTransactions(
        transactions.map((transaction) =>
          transaction.id === transactionId
            ? {
                ...transaction,
                status: 'Completed',
                dispute: transaction.dispute
                  ? { ...transaction.dispute, status: 'Resolved' }
                  : null,
              }
            : transaction
        )
      )
      toast.success(
        `Dispute for transaction R{transactionId} has been resolved`
      )
    } else if (type === 'cancel') {
      setTransactions(
        transactions.map((transaction) =>
          transaction.id === transactionId
            ? { ...transaction, status: 'Cancelled' }
            : transaction
        )
      )
      toast.success(`Transaction R{transactionId} has been cancelled`)
    }

    setShowConfirmModal(false)
    setConfirmAction(null)
    setShowTransactionModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500">
          Monitor and manage platform transactions
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
        onActionClick={handleConfirmAction}
      />

      {showTransactionModal && selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setShowTransactionModal(false)}
          onResolve={(id) => handleConfirmAction('resolve', id)}
          onCancel={(id) => handleConfirmAction('cancel', id)}
        />
      )}

      {showConfirmModal && confirmAction && (
        <ConfirmationModal
          title={
            confirmAction.type === 'resolve'
              ? 'Resolve Dispute'
              : 'Cancel Transaction'
          }
          message={
            confirmAction.type === 'resolve'
              ? 'Are you sure you want to resolve this dispute? This will mark the transaction as completed.'
              : 'Are you sure you want to cancel this transaction? This action cannot be undone.'
          }
          confirmButtonText="Confirm"
          confirmButtonColor={
            confirmAction.type === 'resolve' ? 'green' : 'red'
          }
          onConfirm={executeAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}

export default Transactions
