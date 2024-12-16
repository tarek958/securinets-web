'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ManageChallenges() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/admin/challenges', {
        headers: {
          'x-user-data': localStorage.getItem('userData')
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch challenges');
      }
      
      setChallenges(data.challenges || []);
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Unauthorized')) {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (challenge) => {
    setSelectedChallenge(challenge);
    setShowPreview(true);
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const response = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'x-user-data': localStorage.getItem('userData')
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete challenge');
      }
      
      setChallenges(challenges.filter(challenge => challenge._id !== challengeId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (challengeId, currentStatus) => {
    try {
      const response = await fetch('/api/admin/challenges/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': localStorage.getItem('userData')
        },
        body: JSON.stringify({
          challengeId,
          status: currentStatus
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update challenge status');
      }

      // Refresh challenges list
      await fetchChallenges();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-500">Manage Challenges</h1>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-sm bg-gray-900 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Dashboard
            </button>
            <Link
              href="/admin/challenges/create"
              className="px-4 py-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500/90 transition-colors inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Challenge
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            {error}
          </div>
        )}

        <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg shadow-lg border border-red-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-black/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {challenges.map((challenge) => (
                  <tr key={challenge._id} className="hover:bg-gray-800/40">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-200">
                        {challenge.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{challenge.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">{challenge.points}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleStatus(challenge._id, challenge.status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          challenge.status === 'active'
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {challenge.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(challenge.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handlePreview(challenge)}
                        className="text-red-400 hover:text-red-300 mr-4"
                      >
                        Preview
                      </button>
                      <Link
                        href={`/admin/challenges/${challenge._id}/edit`}
                        className="text-red-400 hover:text-red-300 mr-4"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteChallenge(challenge._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Challenge Preview Modal */}
        {showPreview && selectedChallenge && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 overflow-hidden">
            <div className="relative bg-[#0a0a0a] border-2 border-red-500 rounded-xl shadow-2xl shadow-red-900/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 hover:scale-[1.01]">
              {/* Glitch effect overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20 animate-glitch-anim">
                <div className="absolute inset-0 bg-red-500 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-crimson-500 mix-blend-color-dodge opacity-30"></div>
              </div>

              <div className="relative p-6 space-y-6">
                {/* Close button */}
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Challenge Title and Tags */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{selectedChallenge.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                      {selectedChallenge.category}
                    </span>
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                      {selectedChallenge.difficulty}
                    </span>
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                      {selectedChallenge.points} pts
                    </span>
                  </div>
                </div>

                {/* Challenge Description */}
                <div className="bg-black/40 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{selectedChallenge.description}</p>
                </div>

                {/* Challenge Files */}
                {selectedChallenge.files && selectedChallenge.files.length > 0 && (
                  <div className="font-mono text-gray-300 bg-black/40 p-4 rounded-lg border border-blue-500/30">
                    <h3 className="text-lg font-bold text-blue-400 mb-2">Challenge Files</h3>
                    <ul className="list-disc list-inside">
                      {selectedChallenge.files.map((file, index) => (
                        <li key={index}>
                          <span className="text-blue-400">{file.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Challenge Hints */}
                {selectedChallenge.hints && selectedChallenge.hints.length > 0 && (
                  <div className="font-mono text-gray-300 bg-black/40 p-4 rounded-lg border border-yellow-500/30">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">Hints</h3>
                    <ul className="space-y-2">
                      {selectedChallenge.hints.map((hint, index) => (
                        <li key={index} className="bg-black/40 p-2 rounded">
                          {hint.content}
                          {hint.cost && (
                            <span className="ml-2 text-sm text-yellow-500">
                              ({hint.cost} points)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flag Input (Preview) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Flag Submission (Preview)
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      disabled
                      placeholder="securinets{flag}"
                      className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    This is how users will see the challenge. The flag input is disabled in preview mode.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
