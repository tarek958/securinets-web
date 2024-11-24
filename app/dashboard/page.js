'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrophyIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    solvedCTFs: 0,
    totalPoints: 0,
    forumPosts: 0,
    rank: 'Beginner',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user) {
      // Fetch user stats
      fetchUserStats();
    }
  }, [status, session]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const cards = [
    {
      name: 'CTF Progress',
      value: `${stats.solvedCTFs} solved`,
      description: 'Total CTF challenges completed',
      icon: TrophyIcon,
      href: '/ctfs',
    },
    {
      name: 'Points',
      value: stats.totalPoints,
      description: 'Total points earned',
      icon: AcademicCapIcon,
      href: '/achievements',
    },
    {
      name: 'Forum Activity',
      value: `${stats.forumPosts} posts`,
      description: 'Your contributions to discussions',
      icon: ChatBubbleLeftIcon,
      href: '/forum',
    },
    {
      name: 'Rank',
      value: stats.rank,
      description: 'Current skill level',
      icon: UserGroupIcon,
      href: '/profile',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'ctf',
      title: 'Web Exploitation Basic',
      points: 100,
      date: '2 hours ago',
    },
    {
      id: 2,
      type: 'forum',
      title: 'How to get started with Buffer Overflow?',
      points: 10,
      date: '1 day ago',
    },
    // Add more activities as needed
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          
          {/* Stats */}
          <div className="mt-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map((card) => (
                <Link key={card.name} href={card.href}>
                  <div className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6 hover:shadow-lg transition-shadow">
                    <dt>
                      <div className="absolute rounded-md bg-indigo-500 p-3">
                        <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <p className="ml-16 truncate text-sm font-medium text-gray-500">
                        {card.name}
                      </p>
                    </dt>
                    <dd className="ml-16 flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                    </dd>
                    <p className="ml-16 text-sm text-gray-500">{card.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <div className="mt-4 bg-white shadow rounded-lg">
              <ul role="list" className="divide-y divide-gray-200">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {activity.type === 'ctf' ? (
                            <TrophyIcon className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <ChatBubbleLeftIcon className="h-5 w-5 text-blue-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500">
                            {activity.points} points • {activity.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
