'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getToken } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import RedemptionModal from './RedemptionModal';

interface Redemption {
  id: number;
  date: string;
  customerId: number;
  rewardId: number;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  reward: {
    id: number;
    title: string;
    pointsRequired: number;
  };
}

interface RedemptionsManagementProps {
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function RedemptionsManagement({ onShowToast }: RedemptionsManagementProps) {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  // Fetch redemptions
  const fetchRedemptions = useCallback(async () => {
    setLoading(true);
    setError('');

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/redemptions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch redemptions');
      }

      const result = await response.json();
      if (result.status === 'success') {
        setRedemptions(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch redemptions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch redemptions');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  // Filter and sort redemptions
  const filteredAndSortedRedemptions = useMemo(() => {
    let filtered = redemptions.filter((redemption) => {
      const query = searchQuery.toLowerCase();
      return (
        redemption.customer.name.toLowerCase().includes(query) ||
        redemption.reward.title.toLowerCase().includes(query)
      );
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
  }, [redemptions, searchQuery, sortOrder]);

  // Add redemption
  const handleAddRedemption = async (customerId: number, rewardId: number) => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const response = await fetch('/api/redemptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ customerId, rewardId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to redeem reward');
    }

    if (response.status === 401) {
      router.push('/login');
      return;
    }

    onShowToast(`Reward redeemed successfully! ${result.pointsDeducted} points deducted.`, 'success');
    await fetchRedemptions();
  };

  // Delete redemption
  const handleDeleteRedemption = async (redemptionId: number) => {
    if (!confirm('Are you sure you want to delete this redemption? Points will be restored to the customer.')) {
      return;
    }

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`/api/redemptions?id=${redemptionId}`, {
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
        throw new Error(result.error || 'Failed to delete redemption');
      }

      onShowToast(`Redemption deleted! ${result.pointsRestored} points restored.`, 'success');
      await fetchRedemptions();
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'Failed to delete redemption', 'error');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Redemptions Management</h2>
            {redemptions.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {redemptions.length}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">Track customer reward redemptions</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Redeem Reward
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
              placeholder="Search by customer or reward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
            />
          </div>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading redemptions...</p>
        </div>
      ) : filteredAndSortedRedemptions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg">
            {searchQuery ? 'No redemptions found matching your search' : 'No redemptions yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Redeem the first reward
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRedemptions.map((redemption, index) => (
                  <tr
                    key={redemption.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-purple-50 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {redemption.customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{redemption.customer.name}</div>
                          <div className="text-xs text-gray-500">{redemption.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="text-sm text-gray-900">{redemption.reward.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        -{redemption.reward.pointsRequired} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(redemption.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteRedemption(redemption.id)}
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
            Showing {filteredAndSortedRedemptions.length} of {redemptions.length} redemptions
          </div>
        </>
      )}

      {/* Modal */}
      <RedemptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRedemption}
      />
    </div>
  );
}

