'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import { 
  DocumentChartBarIcon, 
  ExclamationTriangleIcon, 
  ShieldExclamationIcon,
  UserGroupIcon,
  ClockIcon,
  GlobeAltIcon,
  TrophyIcon,
  ChatBubbleLeftIcon,
  FlagIcon,
  EyeIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function LogsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
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

    fetchLogs();
  }, [user, router]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs', {
        headers: {
          'x-user-data': JSON.stringify(user)
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'flag_submission':
        return <FlagIcon className="h-4 w-4" />;
      case 'forum_post':
      case 'forum_comment':
        return <ChatBubbleLeftIcon className="h-4 w-4" />;
      case 'team_join':
      case 'team_leave':
        return <UserGroupIcon className="h-4 w-4" />;
      case 'challenge_view':
        return <EyeIcon className="h-4 w-4" />;
      case 'ip_change':
        return <GlobeAltIcon className="h-4 w-4" />;
      case 'auth':
        return <ArrowRightOnRectangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'flag_submission':
        return `${activity.details.correct ? 'Solved' : 'Failed'} challenge (${activity.details.points || 0} points)`;
      case 'forum_post':
        return `Created forum post: ${activity.details.title}`;
      case 'forum_comment':
        return `Commented on forum post`;
      case 'team_join':
        return `Joined team: ${activity.details.teamName}`;
      case 'team_leave':
        return `Left team: ${activity.details.teamName}`;
      case 'challenge_view':
        return `Viewed challenge (${Math.round(activity.details.timeSpent / 1000)}s)`;
      case 'ip_change':
        return `IP changed to ${activity.ip}`;
      case 'auth':
        return activity.details.action === 'login' ? 'Logged in' : 'Logged out';
      default:
        return 'Unknown activity';
    }
  };

  const getActivityColor = (activity) => {
    switch (activity.type) {
      case 'flag_submission':
        return activity.details.correct ? 'text-green-500' : 'text-red-500';
      case 'forum_post':
      case 'forum_comment':
        return 'text-blue-500';
      case 'team_join':
        return 'text-green-500';
      case 'team_leave':
        return 'text-yellow-500';
      case 'challenge_view':
        return 'text-purple-500';
      case 'ip_change':
        return 'text-orange-500';
      case 'auth':
        return activity.details.action === 'login' ? 'text-green-500' : 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          <DocumentChartBarIcon className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold font-mono">&gt; User_Activity_Logs</h1>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 font-mono">
            [ERROR]: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 font-mono">Loading logs...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((log) => (
              <div
                key={log._id}
                className={`bg-black border ${log.isCheater ? 'border-red-500' : 'border-gray-500'} rounded-lg p-6`}
              >
                {/* Header Section */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold font-mono flex items-center">
                      {log.username}
                      <span className="ml-2 text-xs text-gray-500">({log.email})</span>
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {log.team ? log.team.name : 'No Team'}
                      </span>
                      <span className="flex items-center">
                        <TrophyIcon className="h-4 w-4 mr-1" />
                        {log.ctfPoints} points
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Joined: {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Submission Stats */}
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-mono mb-3 text-gray-400">Challenge Stats</h4>
                    <div className="space-y-4">
                      {/* Overall Stats */}
                      <div>
                        <h5 className="text-xs text-gray-500 mb-2">Overall</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Submissions:</span>
                            <span className="text-blue-400">{log.submissionStats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Correct:</span>
                            <span className="text-green-500">{log.submissionStats.correct}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Wrong:</span>
                            <span className="text-red-500">{log.submissionStats.wrong}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="text-yellow-500">
                              {log.submissionStats.total ? 
                                Math.round((log.submissionStats.correct / log.submissionStats.total) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category Stats */}
                      <div>
                        <h5 className="text-xs text-gray-500 mb-2">By Category</h5>
                        <div className="space-y-3">
                          {Object.entries(log.submissionStats.byCategory || {}).map(([category, stats]) => (
                            <div key={category} className="text-sm">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">{category}</span>
                                <span className="text-blue-400">{stats.points} pts</span>
                              </div>
                              <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ 
                                    width: `${stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%` 
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-gray-500">
                                  {stats.correct}/{stats.total} solved
                                </span>
                                <span className="text-gray-500">
                                  {stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Category Activity */}
                      <div>
                        <h5 className="text-xs text-gray-500 mb-2">Recent Activity</h5>
                        <div className="space-y-2">
                          {Object.entries(log.submissionStats.recentByCategory || {}).map(([category, submissions]) => (
                            <div key={category} className="text-xs">
                              <span className="text-gray-400 block mb-1">{category}:</span>
                              <div className="space-y-1 pl-2">
                                {submissions.map((sub, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`flex items-center justify-between ${sub.correct ? 'text-green-500' : 'text-red-500'}`}
                                  >
                                    <span>{sub.challengeName || 'Unknown Challenge'}</span>
                                    <span className="text-gray-500">{formatDate(sub.timestamp)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forum Stats */}
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-mono mb-3 text-gray-400">Forum Activity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Posts:</span>
                        <span className="text-blue-400">{log.forumStats.posts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comments:</span>
                        <span className="text-blue-400">{log.forumStats.comments}</span>
                      </div>
                    </div>
                  </div>

                  {/* IP Stats */}
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-mono mb-3 text-gray-400">IP Activity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>IP Changes:</span>
                        <span className={log.ipChanges > 5 ? 'text-red-500' : 'text-blue-400'}>
                          {log.ipChanges}
                        </span>
                      </div>
                      <div className="mt-2">
                        <h5 className="text-xs mb-1">Recent IPs:</h5>
                        <div className="space-y-1">
                          {log.ipHistory?.slice(-3).map((ip, idx) => (
                            <div key={idx} className="text-xs flex items-center text-gray-400">
                              <GlobeAltIcon className="h-3 w-3 mr-1" />
                              {ip.ip}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="mt-6">
                  <h4 className="text-sm font-mono mb-3 text-gray-400">Recent Activity Timeline</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <div className="space-y-3">
                      {log.recentActivity?.map((activity, idx) => (
                        <div key={idx} className="flex items-center space-x-3 text-sm">
                          <span className="text-gray-500 w-32 text-xs">
                            {formatDate(activity.timestamp)}
                          </span>
                          <span className={`flex items-center space-x-2 ${getActivityColor(activity)}`}>
                            {getActivityIcon(activity.type)}
                            <span>{getActivityText(activity)}</span>
                          </span>
                          {activity.ip && (
                            <span className="text-xs text-gray-500">from {activity.ip}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
