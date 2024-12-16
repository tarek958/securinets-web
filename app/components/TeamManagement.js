'use client';

import { useState, useEffect } from 'react';
import { UserMinusIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function TeamManagement({ session }) {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/teams/me');
      const data = await response.json();
      if (data.success) {
        setTeam(data.team);
      }
    } catch (error) {
      setError('Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberAction = async (memberId, action) => {
    try {
      const response = await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id,
          memberId,
          action,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh team data
        fetchTeamData();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to perform action');
    }
  };

  if (loading) return <div>Loading team information...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!team) return <div>No team information available</div>;

  const isLeader = team.leaderId === session?.user?.id;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Team Management</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">{team.name}</h3>
            <p className="text-sm text-gray-500">Team Points: {team.points || 0}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Team Members</h4>
          <ul className="space-y-3">
            {team.members?.map((member) => (
              <li key={member._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {member.username}
                    {member._id === team.leaderId && (
                      <span className="ml-2 text-xs text-indigo-600">(Leader)</span>
                    )}
                  </span>
                </div>
                {isLeader && member._id !== team.leaderId && (
                  <button
                    onClick={() => handleMemberAction(member._id, 'remove')}
                    className="text-red-600 hover:text-red-800"
                    title="Remove member"
                  >
                    <UserMinusIcon className="h-5 w-5" />
                  </button>
                )}
                {!isLeader && member._id === session?.user?.id && (
                  <button
                    onClick={() => handleMemberAction(member._id, 'leave')}
                    className="text-gray-600 hover:text-gray-800"
                    title="Leave team"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
