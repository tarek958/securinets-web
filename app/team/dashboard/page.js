'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamDashboard() {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch team data
  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/teams/my-team');
      const data = await response.json();

      if (data.success) {
        setTeam(data.team);
        // Check if current user is team leader
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          const userId = user.sub || user._id || user.id;
          setIsLeader(data.team.leader.id === userId);
        }
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  // Generate new invite code
  const generateInviteCode = async () => {
    try {
      setStatusMessage('Generating new invite code...');
      const response = await fetch('/api/teams/generate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchTeamData();
        setStatusMessage('New invite code generated successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setStatusMessage(data.message || 'Failed to generate invite code');
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      setStatusMessage('Failed to generate invite code');
    }
  };

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setStatusMessage('Invite code copied to clipboard!');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Team Dashboard</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Team Dashboard</h1>
          <p className="text-red-500">{error || 'Team not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Team Dashboard</h1>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mb-4 p-4 bg-blue-600 text-white rounded-lg">
            {statusMessage}
          </div>
        )}

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Team Name</h3>
            <p className="text-2xl">{team.name}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Members</h3>
            <p className="text-2xl">{team.members.length}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Challenges Solved</h3>
            <p className="text-2xl">{team.stats.uniqueChallengesCount || 0}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Total Points</h3>
            <p className="text-2xl">{team.stats.totalPoints || 0}</p>
          </div>
        </div>

        {/* Invite Code Section */}
        {isLeader && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Team Invite Code</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {team.members.length}/4 members
                  {team.members.length >= 4 && " (Maximum reached)"}
                </p>
              </div>
              <button
                onClick={generateInviteCode}
                disabled={team.members.length >= 4}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  team.members.length >= 4
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Generate New Code
              </button>
            </div>
            {team.inviteCode && team.members.length < 4 ? (
              <div className="flex items-center gap-4">
                <code className="bg-gray-900 px-4 py-2 rounded font-mono text-lg">
                  {team.inviteCode}
                </code>
                <button
                  onClick={copyInviteCode}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            ) : team.members.length >= 4 ? (
              <p className="text-yellow-500">Team is full. No new members can be invited.</p>
            ) : (
              <p className="text-gray-400">No invite code generated yet.</p>
            )}
          </div>
        )}

        {/* Team Members Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-6">Team Members</h3>
          <div className="space-y-4">
            {team.members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
              >
                <div>
                  <h4 className="font-semibold">{member.username}</h4>
                  <p className="text-sm text-gray-400">{member.email}</p>
                </div>
                <div className="flex items-center gap-6 mr-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Challenges</p>
                    <p className="font-semibold">{member.solvedCount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Points</p>
                    <p className="font-semibold">{member.points}</p>
                  </div>
                </div>
                <div className="text-sm">
                  {member._id === team.leader.id ? (
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
  );
}
