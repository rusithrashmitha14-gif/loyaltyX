'use client';

import { useState, useEffect } from 'react';

interface Reward {
  id: number;
  title: string;
  description: string;
  pointsRequired: number;
}

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reward: Partial<Reward>) => Promise<void>;
  reward?: Reward | null;
  mode: 'add' | 'edit';
}

export default function RewardModal({ isOpen, onClose, onSubmit, reward, mode }: RewardModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsRequired: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reward && mode === 'edit') {
      setFormData({
        title: reward.title,
        description: reward.description,
        pointsRequired: reward.pointsRequired.toString(),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        pointsRequired: '',
      });
    }
    setError('');
  }, [reward, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        pointsRequired: parseInt(formData.pointsRequired),
      });
      setFormData({ title: '', description: '', pointsRequired: '' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reward');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4 rounded-t-xl">
            <h3 className="text-xl font-bold text-white">
              {mode === 'add' ? 'Add New Reward' : 'Edit Reward'}
            </h3>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Reward Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Free Coffee"
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Describe the reward..."
                />
              </div>

              {/* Points Required Field */}
              <div>
                <label htmlFor="pointsRequired" className="block text-sm font-medium text-gray-700 mb-1">
                  Points Required <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="pointsRequired"
                  required
                  min="1"
                  value={formData.pointsRequired}
                  onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                  placeholder="100"
                />
              </div>
            </div>

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
                disabled={loading}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : mode === 'add' ? 'Add Reward' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

