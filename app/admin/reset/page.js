'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/Providers';
import { ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline';

export default function ResetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-user-data': JSON.stringify(user)
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const users = await response.json();
      setUsers(users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleReset = async (resetType) => {
    if (!confirm(`Are you sure you want to reset ${resetType}? This action cannot be undone.`)) {
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify(user)
        },
        body: JSON.stringify({ 
          resetType,
          ...(resetType === 'user_session' && { userId })
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Reset failed');
      }

      const data = await response.json();
      alert(data.message || 'Reset completed successfully');
      
      if (resetType === 'user_session') {
        setUserId('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  };

  const resetCards = [
    {
      name: 'Reset_All',
      description: 'Reset everything except admin users',
      onClick: () => handleReset('all'),
      color: 'bg-red-900/30',
      warning: 'This will remove all users, challenges, teams, and sessions'
    },
    {
      name: 'Reset_Challenges',
      description: 'Remove all challenges',
      onClick: () => handleReset('challenges'),
      color: 'bg-red-900/30',
      warning: 'This will remove all challenges from the system'
    },
    {
      name: 'Reset_Users',
      description: 'Remove all non-admin users',
      onClick: () => handleReset('users'),
      color: 'bg-red-900/30',
      warning: 'This will remove all regular users while keeping admins'
    },
    {
      name: 'Reset_Teams',
      description: 'Remove all teams',
      onClick: () => handleReset('teams'),
      color: 'bg-red-900/30',
      warning: 'This will remove all teams and their data'
    },
    {
      name: 'Reset_Points',
      description: 'Reset all users and teams points',
      onClick: () => handleReset('points'),
      color: 'bg-red-900/30',
      warning: 'This will reset points and solved challenges for all users and teams'
    },
    {
      name: 'Reset_All_Sessions',
      description: 'Reset all user sessions',
      onClick: () => handleReset('all_sessions'),
      color: 'bg-red-900/30',
      warning: 'This will log out all users from the system'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          <ArrowPathIcon className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold font-mono">&gt; Reset_CTF_Control</h1>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 font-mono">
            [ERROR]: {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resetCards.map((card) => (
            <div
              key={card.name}
              className="block p-6 border border-red-500 rounded-lg bg-black"
            >
              <div className={`inline-flex p-3 rounded-lg ${card.color}`}>
                <ArrowPathIcon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold font-mono">{card.name}</h3>
              <p className="mt-2 text-sm text-gray-400">{card.description}</p>
              <p className="mt-2 text-xs text-red-500/70 font-mono">[WARNING]: {card.warning}</p>
              <button
                onClick={card.onClick}
                disabled={resetLoading}
                className="mt-4 w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500 rounded font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? 'Processing...' : `Execute_${card.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex items-center space-x-2 mb-6">
            <UserIcon className="h-6 w-6 text-red-500" />
            <h2 className="text-2xl font-bold font-mono">&gt; Reset_User_Session</h2>
          </div>

          <div className="max-w-xl">
            <div className="bg-black border border-red-500 rounded-lg p-6">
              <label className="block mb-2 text-sm font-mono">Select User:</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={resetLoading || loadingUsers}
                className="w-full bg-black border border-red-500 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-300"
              >
                <option value="">Select a user...</option>
                {loadingUsers ? (
                  <option disabled>Loading users...</option>
                ) : users.length === 0 ? (
                  <option disabled>No users found</option>
                ) : (
                  users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.role}) - {u.email}
                    </option>
                  ))
                )}
              </select>
              <p className="mt-2 text-xs text-red-500/70 font-mono">
                [WARNING]: This will log out the selected user from all their sessions
              </p>
              <button
                onClick={() => handleReset('user_session')}
                disabled={resetLoading || !userId}
                className="mt-4 w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500 rounded font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? 'Processing...' : 'Reset_Selected_User_Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
