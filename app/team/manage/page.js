'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaUserPlus, FaUserMinus, FaCheck, FaTimes, FaUsers } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function TeamManagePage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.teamId) {
      fetchTeamData();
      fetchPendingRequests();
    }
  }, [session]);

  const fetchTeamData = async () => {
    try {
      const response = await fetch(`/api/teams/${session.user.teamId}`);
      const data = await response.json();
      if (data.success) {
        setTeam(data.team);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team data');
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`/api/teams/requests?teamId=${session.user.teamId}`);
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.pendingMembers);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (userId, action) => {
    try {
      const response = await fetch('/api/teams/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: session.user.teamId,
          userId,
          action
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(action === 'accept' ? 'Member accepted' : 'Request rejected');
        // Refresh data
        fetchTeamData();
        fetchPendingRequests();
      } else {
        toast.error(data.message || 'Failed to process request');
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Failed to process request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8">
        <p className="font-mono text-center">No team data available</p>
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

        {/* Team Members */}
        <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-mono mb-4 flex items-center">
            <FaUsers className="mr-2" />
            &gt; Team_Members
          </h2>
          <div className="space-y-4">
            {team.members?.map((member) => (
              <div 
                key={member._id}
                className="flex items-center justify-between bg-black/50 border border-red-500/30 rounded-lg p-4"
              >
                <div>
                  <p className="font-mono">{member.username}</p>
                  <p className="font-mono text-sm text-red-500/70">
                    {member._id === team.leaderId ? 'Leader' : 'Member'}
                  </p>
                </div>
                {session.user.id === team.leaderId && member._id !== team.leaderId && (
                  <button
                    onClick={() => handleRemoveMember(member._id)}
                    className="px-4 py-2 bg-red-500/10 text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
                  >
                    <FaUserMinus className="mr-2" />
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
