'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Providers';
import { io } from 'socket.io-client';

let socket;

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState({
    timeframe: 'all',
    totalParticipants: 0,
    leaderboard: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    // Socket.io initialization
    socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
    });

    // Listen for leaderboard updates
    socket.on('leaderboard-update', (data) => {
      if (Array.isArray(data)) {
        setLeaderboardData(prev => ({
          ...prev,
          leaderboard: data,
          totalParticipants: data.length
        }));
      }
    });

    // Join leaderboard room
    socket.emit('join-leaderboard');

    // Initial fetch
    fetchLeaderboard();

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('leave-leaderboard');
        socket.disconnect();
      }
    };
  }, []);

  // Update leaderboard when timeframe changes
  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch leaderboard data');
      }
      
      setLeaderboardData({
        timeframe,
        totalParticipants: data.data.length,
        leaderboard: data.data
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOrdinalSuffix = (i) => {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const getMedalColor = (position) => {
    switch (position) {
      case 1: return 'bg-yellow-400';
      case 2: return 'bg-gray-300';
      case 3: return 'bg-amber-600';
      default: return 'bg-gray-100';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  const { leaderboard } = leaderboardData;

  if (!Array.isArray(leaderboard) || leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
              <p className="text-gray-400 mt-2">No participants yet</p>
            </div>
            {/* Timeframe buttons */}
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-lg ${
                  timeframe === 'all' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
                }`}
                onClick={() => setTimeframe('all')}
              >
                All Time
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  timeframe === 'month' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
                }`}
                onClick={() => setTimeframe('month')}
              >
                This Month
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  timeframe === 'week' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
                }`}
                onClick={() => setTimeframe('week')}
              >
                This Week
              </button>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">No participants have joined the competition yet.</p>
            <p className="text-gray-500 mt-2">Be the first to solve a challenge!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
            <p className="text-gray-400 mt-2">Total Participants: {leaderboardData.totalParticipants}</p>
          </div>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-lg ${
                timeframe === 'all' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
              }`}
              onClick={() => setTimeframe('all')}
            >
              All Time
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                timeframe === 'month' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
              }`}
              onClick={() => setTimeframe('month')}
            >
              This Month
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${
                timeframe === 'week' ? 'bg-red-600 text-white' : 'bg-white text-gray-700'
              }`}
              onClick={() => setTimeframe('week')}
            >
              This Week
            </button>
          </div>
        </div>

        {/* Top 3 Users */}
        <div className="bg-gray-800 shadow rounded-lg overflow-hidden mb-8">
          <div className="p-8 bg-gradient-to-r from-red-500 to-red-600">
            <div className="flex justify-center items-end space-x-8">
              {/* Second Place */}
              {leaderboard.length > 1 && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-gray-300 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[1].username}`}
                      alt={leaderboard[1].username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-gray-300 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                    2
                  </div>
                  <p className="text-white font-medium">{leaderboard[1].username}</p>
                  <div>
                    <p className="text-red-100 font-bold">{leaderboard[1].score
                    } pts</p>
                    <p className="text-red-200 text-sm">{leaderboard[1].solvedCount} challenges</p>
                  </div>
                </div>
              )}

              {/* First Place */}
              {leaderboard.length > 0 && (
                <div className="text-center mb-4">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-yellow-400 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[0].username}`}
                      alt={leaderboard[0].username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-yellow-400 text-yellow-800 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                    1
                  </div>
                  <p className="text-white font-medium">{leaderboard[0].username}</p>
                  <div>
                    <p className="text-red-100 font-bold">{leaderboard[0].score} pts</p>
                    <p className="text-red-200 text-sm">{leaderboard[0].solvedCount} challenges</p>
                  </div>
                </div>
              )}

              {/* Third Place */}
              {leaderboard.length > 2 && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full border-4 border-amber-600 overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[2].username}`}
                      alt={leaderboard[2].username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-amber-600 text-amber-100 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2">
                    3
                  </div>
                  <p className="text-white font-medium">{leaderboard[2].username}</p>
                  <div>
                    <p className="text-red-100 font-bold">{leaderboard[2].score} pts</p>
                    <p className="text-red-200 text-sm">{leaderboard[2].solvedCount} challenges</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Last Solve
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {leaderboard.map((user, index) => (
                  <tr key={user._id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center">
                        <span className={`flex-shrink-0 h-6 w-6 rounded-full ${getMedalColor(index + 1)} flex items-center justify-center text-sm`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full overflow-hidden">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                            alt={user.username}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-200">{user.username}</div>
                          <div className="text-sm text-gray-400">{user.solvedCount} challenges solved</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300 font-bold">{user.score} pts</div>
                      {user.solvedCount > 0 && (
                        <div className="text-xs text-gray-400">
                          Avg. {Math.round(user.score / user.solvedCount)} pts/challenge
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(user.lastSolve)}
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
