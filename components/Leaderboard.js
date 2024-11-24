'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './ThemeProvider';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || data.error || 'Failed to fetch leaderboard');
        }

        setUsers(data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className={`text-center ${isDark ? 'text-red-500' : 'text-red-600'}`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            Loading leaderboard...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className={`text-center ${isDark ? 'text-red-500' : 'text-red-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold mb-8 ${isDark ? 'text-red-500' : 'text-red-600'} text-center`}>
          Leaderboard
        </h1>
        
        <div className={`overflow-hidden rounded-lg ${
          isDark ? 'bg-gray-900/50 border border-red-500/30' : 'bg-white border border-gray-200'
        } shadow-xl`}>
          <div className={`${
            isDark ? 'bg-red-500/20' : 'bg-red-50'
          } px-6 py-4`}>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-1 font-semibold text-center">Rank</div>
              <div className="col-span-4 font-semibold">Username</div>
              <div className="col-span-3 font-semibold text-center">Score</div>
              <div className="col-span-4 font-semibold text-center">Last Solve</div>
            </div>
          </div>
          
          <div className={`divide-y ${isDark ? 'divide-red-500/20' : 'divide-gray-200'}`}>
            {users.length === 0 ? (
              <div className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No participants yet. Be the first to solve a challenge!
              </div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user._id}
                  className={`px-6 py-4 transition-colors duration-150 ${
                    isDark 
                      ? 'hover:bg-red-500/10' 
                      : 'hover:bg-red-50'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-center">
                      {index + 1 <= 3 ? (
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-300' :
                          'bg-yellow-700'
                        } text-white font-bold`}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{index + 1}</span>
                      )}
                    </div>
                    <div className={`col-span-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.username}
                    </div>
                    <div className={`col-span-3 text-center ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    } font-semibold`}>
                      {user.score} pts
                    </div>
                    <div className={`col-span-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(user.lastSolve).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`mt-8 p-4 rounded-lg ${
          isDark ? 'bg-gray-900/50 border border-red-500/30' : 'bg-white border border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-red-500' : 'text-red-600'}`}>
            Leaderboard Rules
          </h2>
          <ul className={`list-disc pl-5 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <li>Points are awarded based on challenge difficulty</li>
            <li>First blood bonuses are awarded to first solves</li>
            <li>Time penalties may apply for hints used</li>
            <li>Rankings are updated in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
