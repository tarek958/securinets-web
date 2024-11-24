'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/Providers';
import { 
  UsersIcon, 
  TrophyIcon, 
  ChatBubbleLeftRightIcon, 
  FlagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalChallenges: 0,
    activeChallenges: 0,
    totalWriteups: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchStats();
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'x-user-data': JSON.stringify(user)
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      description: 'Registered platform users',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-red-500'
    },
    {
      name: 'Total Posts',
      value: stats.totalPosts,
      description: 'Forum discussions and announcements',
      icon: ChatBubbleLeftRightIcon,
      href: '/admin/posts',
      color: 'bg-red-600'
    },
    {
      name: 'Total Challenges',
      value: stats.totalChallenges,
      description: 'All CTF challenges',
      icon: TrophyIcon,
      href: '/admin/challenges',
      color: 'bg-red-700'
    },
    {
      name: 'Active Challenges',
      value: stats.activeChallenges,
      description: 'Currently active challenges',
      icon: FlagIcon,
      href: '/admin/challenges/active',
      color: 'bg-red-800'
    },
    {
      name: 'Challenge Writeups',
      value: stats.totalWriteups,
      description: 'Published challenge solutions',
      icon: DocumentTextIcon,
      href: '/writeups',
      color: 'bg-red-900'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/challenges/new"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              New Challenge
            </Link>
            <Link
              href="/writeups"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Manage Writeups
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => (
            <Link
              key={card.name}
              href={card.href}
              className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 ${card.color} rounded-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-white">{card.name}</h2>
                  <p className="text-sm text-gray-400">{card.description}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
