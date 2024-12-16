'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserPlus, FaUserMinus, FaCheck, FaTimes, FaUsers, FaSignOutAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/Providers';

export default function TeamManagePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [team, setTeam] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeader, setIsLeader] = useState(false);

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/teams/my-team');
      const data = await response.json();
      if (data.success) {
        setTeam(data.team);
        setPendingRequests(data.team.pendingMembers || []);
        if (user) {
          const userId = user._id || user.id;
          setIsLeader(data.team.leaderId === userId);
        }
      } else {
        setError(data.message || 'Failed to load team data');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/signin');
      } else {
        fetchTeamData();
      }
    }
  }, [authLoading, user]);

  const handleRequest = async (userId, action) => {
    try {
      const response = await fetch('/api/teams/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id,
          userId,
          action
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(action === 'accept' ? 'Member accepted' : 'Request rejected');
        // Refresh data
        fetchTeamData();
      } else {
        toast.error(data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Failed to process request');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const response = await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id,
          memberId,
          action: 'remove'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Member removed from team');
        fetchTeamData();
      } else {
        toast.error(data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleLeaveTeam = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id,
          memberId: user._id || user.id,
          action: 'leave'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Successfully left the team');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Failed to leave team');
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8">
        <p className="font-mono text-center">{error || 'No team data available'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 flex items-center">
          <FaUsers className="mr-2" />
          &gt; Team_Management_Console
        </h1>

        {/* Team Info */}
        <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-mono mb-4">&gt; Team_Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-sm text-red-500/70">Name:</p>
              <p className="font-mono">{team.name}</p>
            </div>
            <div>
              <p className="font-mono text-sm text-red-500/70">Members:</p>
              <p className="font-mono">{team.members?.length || 1}/4</p>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        {isLeader && (
          <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6">
            <h2 className="text-xl font-mono mb-4 flex items-center">
              <FaUserPlus className="mr-2" />
              &gt; Pending_Requests [{pendingRequests.length}]
            </h2>

            {pendingRequests.length === 0 ? (
              <p className="font-mono text-red-500/70">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div 
                    key={request._id}
                    className="flex items-center justify-between bg-black/50 border border-red-500/30 rounded-lg p-4"
                  >
                    <div>
                      <p className="font-mono">{request.username}</p>
                      <p className="font-mono text-sm text-red-500/70">{request.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRequest(request._id, 'accept')}
                        className="px-4 py-2 bg-green-500/10 text-green-500 rounded border border-green-500 hover:bg-green-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
                      >
                        <FaCheck className="mr-2" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequest(request._id, 'reject')}
                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
                      >
                        <FaTimes className="mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Team Members */}
        <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-mono flex items-center">
              <FaUsers className="mr-2" />
              &gt; Team_Members
            </h2>
            {!isLeader && user && (
              <button
                onClick={handleLeaveTeam}
                className="px-4 py-2 bg-red-500/10 text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
              >
                <FaSignOutAlt className="mr-2" />
                Leave Team
              </button>
            )}
          </div>
          <div className="space-y-4">
            {team.members?.map((member) => {
              const memberId = member._id.toString();
              return (
                <div 
                  key={memberId}
                  className="flex items-center justify-between bg-black/50 border border-red-500/30 rounded-lg p-4"
                >
                  <div>
                    <p className="font-mono">{member.username}</p>
                    <p className="font-mono text-sm text-red-500/70">
                      {memberId === team.leaderId ? 'Leader' : 'Member'}
                    </p>
                  </div>
                  {isLeader && memberId !== team.leaderId && (
                    <button
                      onClick={() => handleRemoveMember(memberId)}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
                    >
                      <FaUserMinus className="mr-2" />
                      Remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
