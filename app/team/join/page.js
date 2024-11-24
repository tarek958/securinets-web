'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function JoinTeam() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch public teams
  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams?public=true');
      const data = await response.json();
      if (data.success) {
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to fetch teams');
    }
  };

  // Load teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);

  const handleJoinTeam = async (teamId, isPublic = true) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          ...(isPublic ? {} : { inviteCode }),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        if (data.status === 'joined') {
          router.push('/team/dashboard');
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter teams based on search query
  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Join a Team</h1>

        {/* Private Team Section */}
        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Join Private Team</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              onClick={() => handleJoinTeam(null, false)}
              disabled={isLoading || !inviteCode}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {/* Public Teams Section */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Join Public Team</h2>
          
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Teams List */}
          <div className="grid gap-4">
            {filteredTeams.map((team) => (
              <div
                key={team._id}
                className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="text-xl font-semibold">{team.name}</h3>
                  <p className="text-gray-400">{team.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Members: {team.members.length}
                  </div>
                </div>
                <button
                  onClick={() => handleJoinTeam(team._id)}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Request to Join
                </button>
              </div>
            ))}

            {filteredTeams.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No teams found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
