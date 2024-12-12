'use client';

import { useAuth } from '@/components/Providers';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaUserSecret, FaEnvelope, FaShieldAlt, FaTrophy, FaHackerrank } from 'react-icons/fa';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    solvedChallenges: 0,
    totalPoints: 0,
    rank: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    // Fetch user stats
    if (user) {
      fetchUserStats();
    }
  }, [user, loading, router]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-red-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Card */}
        <div className="bg-black/50 backdrop-blur-sm border border-red-500/30 rounded-lg overflow-hidden shadow-2xl mb-8 hover:shadow-red-500/20 transition-all duration-300">
          <div className="relative">
            {/* Matrix-like background pattern */}
            <div className="absolute inset-0 opacity-10 mix-blend-screen">
              <div className="matrix-bg w-full h-full"></div>
            </div>
            
            {/* Header */}
            <div className="px-6 py-8 relative">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-red-500 glitch-text">
                    {user.username}
                  </h1>
                  <p className="text-red-400/80 mt-1">Agent Profile</p>
                </div>
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-red-600 to-red-900 flex items-center justify-center">
                  <FaUserSecret className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4">
            <div className="bg-black/40 p-4 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">
              <div className="flex items-center space-x-3">
                <FaTrophy className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-sm text-red-400">Points</p>
                  <p className="text-xl font-bold text-red-500">{stats.totalPoints}</p>
                </div>
              </div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">
              <div className="flex items-center space-x-3">
                <FaHackerrank className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-sm text-red-400">Rank</p>
                  <p className="text-xl font-bold text-red-500">#{stats.rank}</p>
                </div>
              </div>
            </div>
            <div className="bg-black/40 p-4 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">
              <div className="flex items-center space-x-3">
                <FaShieldAlt className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-sm text-red-400">Challenges Solved</p>
                  <p className="text-xl font-bold text-red-500">{stats.solvedChallenges}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-black/40 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">
              <FaUserSecret className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-red-400">Username</p>
                <p className="text-lg text-red-100">{user.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-black/40 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">
              <FaEnvelope className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-red-400">Email</p>
                <p className="text-lg text-red-100">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-black/40 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors">
              <FaShieldAlt className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-red-400">Role</p>
                <p className="text-lg text-red-100">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .matrix-bg {
          background: linear-gradient(rgba(0, 0, 0, 0.2) 2px, transparent 2px),
                      linear-gradient(90deg, rgba(0, 0, 0, 0.2) 2px, transparent 2px);
          background-size: 30px 30px;
          animation: matrix 20s linear infinite;
        }

        .glitch-text {
          text-shadow: 
            0 0 5px rgba(255, 0, 0, 0.7),
            0 0 10px rgba(255, 0, 0, 0.5),
            0 0 15px rgba(255, 0, 0, 0.3);
          animation: glitch 3s infinite;
        }

        @keyframes matrix {
          0% { background-position: 0 0; }
          100% { background-position: 30px 30px; }
        }

        @keyframes glitch {
          0% { text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5); }
          50% { text-shadow: 0 0 10px rgba(255, 0, 0, 0.7), 0 0 20px rgba(255, 0, 0, 0.5); }
          100% { text-shadow: 0 0 5px rgba(255, 0, 0, 0.7), 0 0 10px rgba(255, 0, 0, 0.5); }
        }
      `}</style>
    </div>
  );
}
