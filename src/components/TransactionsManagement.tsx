'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getToken } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import TransactionModal from './TransactionModal';

interface Transaction {
  id: number;
  amount: number;
  date: string;
  customerId: number;
  businessId: number;
  customer: {
    id: number;
    name: string;
    email: string;
    points: number;
  };
}

interface TransactionsManagementProps {
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function TransactionsManagement({ onShowToast }: TransactionsManagementProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const router = useRouter();

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setTransactions(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate points from amount
  const calculatePoints = (amount: number) => {
    return Math.floor(amount / 100);
  };

  // Filter by date
  const filterByDate = useCallback((transaction: Transaction): boolean => {
    if (dateFilter === 'all') return true;

    const transDate = new Date(transaction.date);
    const now = new Date();

    if (dateFilter === 'today') {
      return transDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return transDate >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return transDate >= monthAgo;
    }

    return true;
  }, [dateFilter]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = transaction.customer.name.toLowerCase().includes(query);
      const matchesDate = filterByDate(transaction);
      return matchesSearch && matchesDate;
    });

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    return filtered;
  }, [transactions, searchQuery, sortOrder, filterByDate]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const filtered = filteredAndSortedTransactions;
    const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
    const totalPoints = filtered.reduce((sum, t) => sum + calculatePoints(t.amount), 0);

    return {
      totalTransactions: filtered.length,
      totalAmount,
      totalPoints,
    };
  }, [filteredAndSortedTransactions]);

  // Add transaction
  const handleAddTransaction = async (transactionData: Partial<Transaction>) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add transaction');
    }

    if (response.status === 401) {
      router.push('/login');
      return;
    }

    if (onShowToast) {
      onShowToast(`Transaction added! ${result.pointsAwarded} points awarded.`, 'success');
    }
    await fetchTransactions();
  };

  // Edit transaction
  const handleEditTransaction = async (transactionData: Partial<Transaction>) => {
    if (!selectedTransaction) return;

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const response = await fetch(`/api/transactions?id=${selectedTransaction.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update transaction');
    }

    if (response.status === 401) {
      router.push('/login');
      return;
    }

    if (onShowToast) {
      const adjustment = result.pointsAdjustment || 0;
      const message = adjustment > 0
        ? `Transaction updated! ${adjustment} points added.`
        : adjustment < 0
          ? `Transaction updated! ${Math.abs(adjustment)} points deducted.`
          : 'Transaction updated successfully!';
      onShowToast(message, 'success');
    }
    await fetchTransactions();
  };

  // Delete transaction
  const handleDeleteTransaction = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this transaction? The points will be deducted from the customer.')) {
      return;
    }

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/transactions?id=${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transaction');
      }

      if (onShowToast) {
        onShowToast(`Transaction deleted! ${result.pointsRemoved} points removed.`, 'success');
      }
      await fetchTransactions();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err instanceof Error ? err.message : 'Failed to delete transaction', 'error');
      }
    }
  };

  // Open add modal
  const openAddModal = () => {
    setSelectedTransaction(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions Management</h2>
          <p className="text-gray-600 mt-1">Track customer purchases and points</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-700">Total Transactions</p>
          <p className="text-2xl font-bold text-green-900">{summary.totalTransactions}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-700">Total Amount</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm font-medium text-yellow-700">Total Points Earned</p>
          <p className="text-2xl font-bold text-yellow-900">{summary.totalPoints} pts</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="sm:w-48">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Sort by Date */}
        <div className="sm:w-48">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Date: {sortOrder === 'asc' ? '↑ Oldest' : '↓ Newest'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      ) : filteredAndSortedTransactions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-lg">
            {searchQuery || dateFilter !== 'all' ? 'No transactions found matching your filters' : 'No transactions yet'}
          </p>
          {!searchQuery && dateFilter === 'all' && (
            <button
              onClick={openAddModal}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              Add your first transaction
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points Earned</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTransactions.map((transaction, index) => (
                  <tr
                    key={transaction.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-green-50 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium text-sm">
                            {transaction.customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{transaction.customer.name}</div>
                          <div className="text-xs text-gray-500">{transaction.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(transaction.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(transaction.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        +{calculatePoints(transaction.amount)} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(transaction)}
                        className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-150"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-900 transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredAndSortedTransactions.length} of {transactions.length} transactions
          </div>
        </>
      )}

      {/* Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'add' ? handleAddTransaction : handleEditTransaction}
        transaction={selectedTransaction}
        mode={modalMode}
      />
    </div>
  );
}

