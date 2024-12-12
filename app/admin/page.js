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
  DocumentTextIcon,
  CommandLineIcon
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
      <div className="min-h-screen bg-black p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Users_DB',
      value: stats.totalUsers,
      description: 'Active system users in database',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-red-500/10'
    },
    {
      name: 'Posts_LOG',
      value: stats.totalPosts,
      description: 'Recorded communications and broadcasts',
      icon: ChatBubbleLeftRightIcon,
      href: '/admin/posts',
      color: 'bg-red-500/10'
    },
    {
      name: 'CTF_Challenges',
      value: stats.totalChallenges,
      description: 'Active security challenges',
      icon: TrophyIcon,
      href: '/admin/challenges',
      color: 'bg-red-500/10'
    },
    {
      name: 'Active_CTF',
      value: stats.activeChallenges,
      description: 'Currently deployed challenges',
      icon: FlagIcon,
      href: '/admin/challenges?status=active',
      color: 'bg-red-500/10'
    },
    {
      name: 'Writeups_DB',
      value: stats.totalWriteups,
      description: 'Documented solution reports',
      icon: DocumentTextIcon,
      href: '/admin/writeups',
      color: 'bg-red-500/10'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          <CommandLineIcon className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold font-mono">&gt; Admin_Control_Panel</h1>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 font-mono">
            [ERROR]: {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <Link
              key={card.name}
              href={card.href}
              className="group block p-6 bg-gray-900 rounded-lg border border-red-500/50 hover:border-red-500 hover:bg-red-500/5 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 ${card.color} rounded-lg border border-red-500`}>
                    <card.icon className="h-6 w-6 text-red-500" aria-hidden="true" />
                  </div>
                  <div className="ml-4">
                    <p className="text-lg font-semibold font-mono text-red-500">{card.name}</p>
                    <p className="mt-1 text-sm text-red-500/70 font-mono">{card.description}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold font-mono text-red-500">
                  {card.value.toString().padStart(2, '0')}
                </p>
              </div>
              <div className="mt-4 text-sm text-red-500/50 font-mono group-hover:text-red-500/70 transition-colors">
                &gt; Click to access_{card.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
