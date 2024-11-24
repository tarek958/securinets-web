'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import MatrixBackground from '@/components/MatrixBackground';

export default function CreateTeamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify(user)
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create team');
      }

      router.push('/team/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 relative">
        <MatrixBackground />
        <div className="relative z-10 flex justify-center items-center h-screen">
          <div className="text-center text-white">
            Please log in to create a team.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900/70 relative">
      <MatrixBackground />
      <div className="relative z-10">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm">
            <h1 className="text-2xl font-bold text-white mb-6">Create Your Team</h1>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="Enter your team name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                  rows={4}
                  minLength={10}
                  maxLength={500}
                  placeholder="Describe your team"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-600 rounded bg-gray-700"
                />
                <label className="ml-2 block text-sm text-gray-300">
                  Make team public
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800'
                }`}
              >
                {loading ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
