'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getToken } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import RewardModal from './RewardModal';

interface Reward {
  id: number;
  title: string;
  description: string;
  pointsRequired: number;
  businessId: number;
}

interface RewardsManagementProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function RewardsManagement({ onShowToast }: RewardsManagementProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const router = useRouter();

  // Fetch rewards
  const fetchRewards = useCallback(async () => {
    setLoading(true);
    setError('');

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/rewards', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setRewards(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch rewards');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rewards');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  // Filter and sort rewards
  const filteredAndSortedRewards = useMemo(() => {
    let filtered = rewards.filter((reward) => {
      const query = searchQuery.toLowerCase();
      return (
        reward.title.toLowerCase().includes(query) ||
        (reward.description && reward.description.toLowerCase().includes(query))
      );
    });

    // Sort by points
    filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.pointsRequired - b.pointsRequired;
      } else {
        return b.pointsRequired - a.pointsRequired;
      }
    });

    return filtered;
  }, [rewards, searchQuery, sortOrder]);

  // Add reward
  const handleAddReward = async (rewardData: Partial<Reward>) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const response = await fetch('/api/rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(rewardData),
    });

    if (response.status === 401) {
      router.push('/login');
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to add reward');
    }

    onShowToast('Reward added successfully!', 'success');
    await fetchRewards();
  };

  // Edit reward
  const handleEditReward = async (rewardData: Partial<Reward>) => {
    if (!selectedReward) return;

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const response = await fetch(`/api/rewards?id=${selectedReward.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(rewardData),
    });

    if (response.status === 401) {
      router.push('/login');
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update reward');
    }

    onShowToast('Reward updated successfully!', 'success');
    await fetchRewards();
  };

  // Delete reward
  const handleDeleteReward = async (rewardId: number) => {
    if (!confirm('Are you sure you want to delete this reward? This action cannot be undone.')) {
      return;
    }

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/rewards?id=${rewardId}`, {
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
        throw new Error(result.error || 'Failed to delete reward');
      }

      onShowToast('Reward deleted successfully!', 'success');
      await fetchRewards();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to delete reward', 'error');
    }
  };

  // Open add modal
  const openAddModal = () => {
    setSelectedReward(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (reward: Reward) => {
    setSelectedReward(reward);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rewards Management</h2>
          <p className="text-gray-600 mt-1">Create and manage loyalty rewards</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Reward
        </button>
      </div>

      {/* Search and Filter */}
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
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Sort by Points */}
        <div className="sm:w-48">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Points: {sortOrder === 'asc' ? '↑ Low to High' : '↓ High to Low'}
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      ) : filteredAndSortedRewards.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="text-gray-600 text-lg">
            {searchQuery ? 'No rewards found matching your search' : 'No rewards yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddModal}
              className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Create your first reward
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Required</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRewards.map((reward, index) => (
                  <tr
                    key={reward.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-yellow-50 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{reward.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{reward.description || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {reward.pointsRequired} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(reward)}
                        className="text-yellow-600 hover:text-yellow-900 mr-4 transition-colors duration-150"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
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
            Showing {filteredAndSortedRewards.length} of {rewards.length} rewards
          </div>
        </>
      )}

      {/* Modal */}
      <RewardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'add' ? handleAddReward : handleEditReward}
        reward={selectedReward}
        mode={modalMode}
      />
    </div>
  );
}

