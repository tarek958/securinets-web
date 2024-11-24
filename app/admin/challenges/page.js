'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ManageChallenges() {
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const response = await fetch(`/api/admin/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': localStorage.getItem('userData')
        },
        body: JSON.stringify({ status: currentStatus === 'active' ? 'inactive' : 'active' }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update challenge status');
      }
      
      setChallenges(challenges.map(challenge => 
        challenge._id === challengeId 
          ? { ...challenge, status: currentStatus === 'active' ? 'inactive' : 'active' } 
          : challenge
      ));
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        challenge.status === 'active'
                          ? 'bg-green-900/60 text-green-400'
                          : 'bg-gray-800/60 text-gray-400'
                      }`}>
                        {challenge.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(challenge.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleToggleStatus(challenge._id, challenge.status)}
                        className="text-red-400 hover:text-red-300 mr-4"
                      >
                        {challenge.status === 'active' ? 'Deactivate' : 'Activate'}
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
      </div>
    </div>
  );
}
