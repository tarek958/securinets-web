'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function TeamDashboard() {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch team data
  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/teams/my-team');
      const data = await response.json();

      if (data.success && data.team) {
        setTeam(data.team);
        // If user is team leader, fetch pending requests
        if (data.team.leaderId === data.team.members.find(m => m._id === data.team.leaderId)?._id) {
          fetchPendingRequests(data.team._id);
        }
      } else {
        console.log('No team found, redirecting to join page');
        router.push('/team/join');
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to fetch team data');
      router.push('/team/join');
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending join requests
  const fetchPendingRequests = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/requests?teamId=${teamId}`);
      const data = await response.json();
      
      if (data.success) {
        setPendingMembers(data.pendingMembers);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch join requests');
    }
  };

  // Handle join request
  const handleJoinRequest = async (userId, action) => {
    try {
      const response = await fetch('/api/teams/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id,
          userId,
          action,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        // Refresh pending requests
        fetchPendingRequests(team._id);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Failed to handle join request');
    }
  };

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      toast.success('Invite code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-xl">Loading team data...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
        <div className="text-xl mb-4">You are not part of a team</div>
        <button
          onClick={() => router.push('/team/join')}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md"
        >
          Join a Team
        </button>
      </div>
    );
  }

  const isLeader = team.leaderId === team.members.find(m => m._id === team.leaderId)?._id;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h1 className="text-4xl font-bold mb-4">{team.name}</h1>
          <p className="text-gray-400 mb-4">{team.description}</p>
          
          {/* Team Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Members</h3>
              <p className="text-2xl">{team.members.length}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Challenges Solved</h3>
              <p className="text-2xl">{team.solvedChallenges?.length || 0}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Total Points</h3>
              <p className="text-2xl">{team.points || 0}</p>
            </div>
          </div>

          {/* Invite Code Section (Only for private teams) */}
          {!team.isPublic && isLeader && (
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-2">Team Invite Code</h3>
              <div className="flex items-center gap-4">
                <code className="bg-gray-700 px-4 py-2 rounded">{team.inviteCode}</code>
                <button
                  onClick={copyInviteCode}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm"
                >
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          )}

          {/* Pending Requests Section (Only for team leader) */}
          {isLeader && pendingMembers.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Pending Join Requests</h3>
              <div className="grid gap-4">
                {pendingMembers.map((member) => (
                  <div key={member._id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                    <div>
                      <p className="font-semibold">{member.username}</p>
                      <p className="text-sm text-gray-400">{member.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinRequest(member._id, 'accept')}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleJoinRequest(member._id, 'reject')}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members List */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Team Members</h3>
            <div className="grid gap-4">
              {team.members.map((member) => (
                <div key={member._id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                  <div>
                    <p className="font-semibold">{member.username}</p>
                    <p className="text-sm text-gray-400">{member.email}</p>
                  </div>
                  <div className="text-sm">
                    {member._id === team.leaderId ? (
                      <span className="bg-yellow-600 px-3 py-1 rounded-full">Leader</span>
                    ) : (
                      <span className="bg-blue-600 px-3 py-1 rounded-full">Member</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
