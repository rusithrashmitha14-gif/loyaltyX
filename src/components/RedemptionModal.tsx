'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth-utils';

interface Customer {
  id: number;
  name: string;
  email: string;
  points: number;
}

interface Reward {
  id: number;
  title: string;
  pointsRequired: number;
}

interface RedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerId: number, rewardId: number) => Promise<void>;
}

export default function RedemptionModal({ isOpen, onClose, onSubmit }: RedemptionModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchingData, setFetchingData] = useState(true);

  // Fetch customers and rewards when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchData();
    } else {
      // Reset form when modal closes
      setSelectedCustomerId('');
      setSelectedRewardId('');
      setError('');
    }
  }, [isOpen]);

  const fetchData = async () => {
    setFetchingData(true);
    const token = getToken();
    if (!token) return;

    try {
      const [customersRes, rewardsRes] = await Promise.all([
        fetch('/api/customers', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/rewards', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [customersData, rewardsData] = await Promise.all([
        customersRes.json(),
        rewardsRes.json(),
      ]);

      if (customersData.status === 'success') {
        setCustomers(customersData.data || []);
      }
      if (rewardsData.status === 'success') {
        setRewards(rewardsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!selectedCustomerId || !selectedRewardId) {
      setError('Please select both a customer and a reward');
      return;
    }

    // Check if customer has enough points
    const customer = customers.find(c => c.id === parseInt(selectedCustomerId));
    const reward = rewards.find(r => r.id === parseInt(selectedRewardId));
    
    if (customer && reward) {
      if (customer.points < reward.pointsRequired) {
        setError(`Insufficient points. ${customer.name} has ${customer.points} points but needs ${reward.pointsRequired} points.`);
        return;
      }
    }

    setLoading(true);

    try {
      await onSubmit(parseInt(selectedCustomerId), parseInt(selectedRewardId));
      setSelectedCustomerId('');
      setSelectedRewardId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem reward');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === parseInt(selectedCustomerId));
  const selectedReward = rewards.find(r => r.id === parseInt(selectedRewardId));

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
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-xl">
            <h3 className="text-xl font-bold text-white">Redeem Reward</h3>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading data...</p>
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
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
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
                      Available points: <span className="font-semibold text-green-600">{selectedCustomer.points}</span>
                    </p>
                  )}
                </div>

                {/* Reward Select */}
                <div>
                  <label htmlFor="reward" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Reward <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="reward"
                    required
                    value={selectedRewardId}
                    onChange={(e) => setSelectedRewardId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900"
                  >
                    <option value="">-- Select a reward --</option>
                    {rewards.map((reward) => (
                      <option key={reward.id} value={reward.id}>
                        {reward.title} ({reward.pointsRequired} points)
                      </option>
                    ))}
                  </select>
                  {selectedReward && (
                    <p className="text-xs text-gray-500 mt-1">
                      Required points: <span className="font-semibold text-yellow-600">{selectedReward.pointsRequired}</span>
                    </p>
                  )}
                </div>

                {/* Points Calculation */}
                {selectedCustomer && selectedReward && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Redemption Summary:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Points:</span>
                        <span className="font-semibold">{selectedCustomer.points}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Points Required:</span>
                        <span className="font-semibold text-red-600">-{selectedReward.pointsRequired}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                        <span className="text-gray-700 font-medium">Remaining Points:</span>
                        <span className={`font-bold ${selectedCustomer.points - selectedReward.pointsRequired >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedCustomer.points - selectedReward.pointsRequired}
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
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : 'Redeem Reward'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

