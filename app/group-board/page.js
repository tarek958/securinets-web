'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Providers';
import MatrixBackground from '@/components/MatrixBackground';
import './styles.css';

export default function GroupBoard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/teams/leaderboard');
        if (!res.ok) {
          throw new Error('Failed to fetch teams');
        }
        const data = await res.json();
        // Ensure teams is always an array
        setTeams(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 relative">
        <MatrixBackground />
        <div className="relative z-10 flex justify-center items-center h-screen">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading team rankings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 relative">
        <MatrixBackground />
        <div className="relative z-10 flex justify-center items-center h-screen">
          <div className="text-center p-8 text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <MatrixBackground />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Team Rankings</h1>
        
        {/* Top 3 Teams Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Second Place */}
          {teams[1] && (
            <div className="transform md:translate-y-4">
              <div className="relative bg-gray-800 rounded-lg p-6 border-2 border-gray-400 shadow-lg overflow-hidden group hover:border-gray-300 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400/10 to-gray-400/0 group-hover:from-gray-400/20"></div>
                <div className="relative">
                  <div className="text-center">
                    <div className="text-gray-400 text-xl font-bold mb-2">#2</div>
                    <div className="text-white text-lg font-semibold mb-3 overflow-hidden">
                      {teams[1].name}
                    </div>
                    <div className="text-gray-400 font-mono">
                      <span className="text-sm">POINTS:</span>
                      <div className="text-2xl font-bold">{teams[1].totalPoints}</div>
                      <div className="text-sm text-gray-500">
                        {teams[1].solvedCount} challenges solved
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-gray-400/20 rounded-lg pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* First Place */}
          {teams[0] && (
            <div className="transform">
              <div className="relative bg-gray-800 rounded-lg p-8 border-2 border-yellow-500 shadow-xl overflow-hidden group hover:border-yellow-400 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/0 group-hover:from-yellow-500/20"></div>
                <div className="relative">
                  <div className="text-center">
                    <div className="text-yellow-500 text-2xl font-bold mb-3">#1</div>
                    <div className="text-white text-xl font-bold mb-4 overflow-hidden">
                      {teams[0].name}
                    </div>
                    <div className="text-yellow-500 font-mono">
                      <span className="text-sm">POINTS:</span>
                      <div className="text-3xl font-bold">{teams[0].totalPoints}</div>
                      <div className="text-sm text-yellow-400">
                        {teams[0].solvedCount} challenges solved
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
                <div className="absolute inset-0 border-2 border-yellow-500/20 rounded-lg pointer-events-none"></div>
              </div>
            </div>
          )}

          {/* Third Place */}
          {teams[2] && (
            <div className="transform md:translate-y-4">
              <div className="relative bg-gray-800 rounded-lg p-6 border-2 border-yellow-700 shadow-lg overflow-hidden group hover:border-yellow-600 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-700/10 to-yellow-700/0 group-hover:from-yellow-700/20"></div>
                <div className="relative">
                  <div className="text-center">
                    <div className="text-yellow-700 text-xl font-bold mb-2">#3</div>
                    <div className="text-white text-lg font-semibold mb-3 overflow-hidden">
                      {teams[2].name}
                    </div>
                    <div className="text-yellow-700 font-mono">
                      <span className="text-sm">POINTS:</span>
                      <div className="text-2xl font-bold">{teams[2].totalPoints}</div>
                      <div className="text-sm text-yellow-600">
                        {teams[2].solvedCount} challenges solved
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 border-2 border-yellow-700/20 rounded-lg pointer-events-none"></div>
              </div>
            </div>
          )}
        </div>

        {/* Rankings Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className="bg-gray-700">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Team
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {teams.map((team, index) => (
                  <tr 
                    key={team._id}
                    className={`${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                    } hover:bg-gray-700 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{team.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">
                      {team.totalPoints}
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
