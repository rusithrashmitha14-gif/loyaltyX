'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth-utils';

interface Customer {
  id: number;
  name: string;
  email: string;
  points: number;
}

interface Transaction {
  id: number;
  amount: number;
  date: string;
  customerId: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Partial<Transaction>) => Promise<void>;
  transaction?: Transaction | null;
  mode: 'add' | 'edit';
}

export default function TransactionModal({ isOpen, onClose, onSubmit, transaction, mode }: TransactionModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch customers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      
      if (transaction && mode === 'edit') {
        setFormData({
          customerId: transaction.customerId.toString(),
          amount: transaction.amount.toString(),
          date: new Date(transaction.date).toISOString().split('T')[0],
        });
      } else {
        setFormData({
          customerId: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
    setError('');
  }, [transaction, mode, isOpen]);

  const fetchCustomers = async () => {
    setFetchingData(true);
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.status === 'success') {
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.customerId || !formData.amount) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        customerId: parseInt(formData.customerId),
        amount: amount,
        date: formData.date,
      });
      setFormData({ customerId: '', amount: '', date: new Date().toISOString().split('T')[0] });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = (amount: number) => {
    return Math.floor(amount / 100);
  };

  const selectedCustomer = customers.find(c => c.id === parseInt(formData.customerId));
  const pointsToEarn = formData.amount ? calculatePoints(parseFloat(formData.amount)) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-xl">
            <h3 className="text-xl font-bold text-white">
              {mode === 'add' ? 'Add New Transaction' : 'Edit Transaction'}
            </h3>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {fetchingData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading customers...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Customer Select */}
                <div>
                  <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="customer"
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    disabled={mode === 'edit'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 disabled:bg-gray-100"
                  >
                    <option value="">-- Select a customer --</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.points} points)
                      </option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current points: <span className="font-semibold text-green-600">{selectedCustomer.points}</span>
                    </p>
                  )}
                </div>

                {/* Amount Field */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (LKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    placeholder="5000.00"
                  />
                  {formData.amount && (
                    <p className="text-xs text-gray-500 mt-1">
                      Points to earn: <span className="font-semibold text-green-600">{pointsToEarn} points</span>
                    </p>
                  )}
                </div>

                {/* Date Field */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
                  />
                </div>

                {/* Points Calculation Summary */}
                {selectedCustomer && formData.amount && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Transaction Summary:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-semibold">LKR {parseFloat(formData.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points to Earn:</span>
                        <span className="font-semibold text-green-600">+{pointsToEarn} points</span>
                      </div>
                      <div className="flex justify-between border-t border-green-300 pt-1 mt-1">
                        <span className="text-gray-700 font-medium">New Total Points:</span>
                        <span className="font-bold text-green-600">
                          {selectedCustomer.points + pointsToEarn} points
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingData}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : mode === 'add' ? 'Add Transaction' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

