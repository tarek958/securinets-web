'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function JoinTeam() {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [publicTeams, setPublicTeams] = useState([]);
  const [requestLoading, setRequestLoading] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchPublicTeams();
  }, []);

  const fetchPublicTeams = async () => {
    try {
      const response = await fetch('/api/teams?public=true');
      const data = await response.json();
      if (data.success) {
        setPublicTeams(data.teams);
      }
    } catch (error) {
      console.error('Error fetching public teams:', error);
      toast.error('Failed to load public teams');
    }
  };

  const handleJoinRequest = async (teamId) => {
    setRequestLoading(teamId);
    try {
      const response = await fetch('/api/teams/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Join request sent successfully');
        router.push('/team/dashboard');
      } else {
        toast.error(data.message || 'Failed to send join request');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      toast.error('Failed to send join request');
    } finally {
      setRequestLoading(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Successfully joined team');
        router.push('/team/dashboard');
      } else {
        toast.error(data.message || 'Failed to join team');
      }
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-red-500 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
          <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6">
            <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
              &gt; Join_Team_Protocol
            </h1>
            <p className="text-sm text-red-400/70 font-mono mt-2">
              <span className="text-red-500">[</span> ENTER TEAM ACCESS CODE <span className="text-red-500">]</span>
            </p>
          </div>
        </div>

        {/* Join Form */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25"></div>
          <form onSubmit={handleSubmit} className="relative bg-black rounded-lg p-8">
            {/* Terminal-like header */}
            <div className="font-mono text-sm mb-6">
              <div className="text-red-400/70">&gt; Initializing team join sequence...</div>
              <div className="text-red-400/70">&gt; Awaiting access code input...</div>
            </div>

            {/* Input field with cyberpunk styling */}
            <div className="relative group mb-8">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-900 rounded-md blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="relative w-full bg-black border border-red-500/50 rounded-md px-4 py-3 text-red-500 font-mono placeholder-red-500/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                placeholder="ENTER_ACCESS_CODE"
                required
              />
              <div className="absolute left-0 -bottom-5 text-xs text-red-400/50 font-mono">
                &gt; Format: XXXX-XXXX-XXXX
              </div>
            </div>

            {/* Submit button with animation */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-md"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative flex items-center justify-center bg-black text-red-500 font-mono py-3 rounded-md border border-red-500/30 group-hover:border-red-500/50 transition-all duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`h-full w-1 bg-gradient-to-b from-transparent via-red-500 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 ${loading ? 'animate-pulse' : ''}`}></div>
                </div>
                <span className="relative z-10">
                  {loading ? 'PROCESSING...' : 'INITIATE JOIN SEQUENCE'}
                </span>
              </div>
            </button>

            {/* Terminal-like status messages */}
            <div className="mt-6 font-mono text-sm text-red-400/70">
              <div>&gt; System ready for team integration...</div>
            </div>
          </form>
        </div>
      </div>

      {/* Public Teams Section */}
      <div className="mt-12">
        <div className="relative mb-8 max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25"></div>
          <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6">
            <h2 className="text-2xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
              &gt; Public_Teams_Directory
            </h2>
            <p className="text-sm text-red-400/70 font-mono mt-2">
              <span className="text-red-500">[</span> SELECT TEAM TO REQUEST ACCESS <span className="text-red-500">]</span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto">
          {publicTeams.map((team) => (
            <div key={team._id} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-black rounded-lg p-6 border border-red-500/30">
                <div className="flex flex-col space-y-4">
                  <div>
                    <h3 className="text-xl font-mono text-red-500 mb-2">{team.name}</h3>
                    <p className="text-red-400/70 text-sm font-mono mb-4">{team.description}</p>
                    <div className="text-red-400/50 text-xs font-mono">
                      <span>Members: {team.members.length}</span>
                      <span className="ml-4">Points: {team.points}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinRequest(team._id)}
                    disabled={requestLoading === team._id}
                    className="relative group overflow-hidden rounded-md w-full"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                    <div className="relative flex items-center justify-center bg-black text-red-500 font-mono py-2 px-4 rounded-md border border-red-500/30 group-hover:border-red-500/50 transition-all duration-300">
                      {requestLoading === team._id ? 'PROCESSING...' : 'REQUEST ACCESS'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {publicTeams.length === 0 && (
            <div className="text-center text-red-400/70 font-mono py-8">
              <div>&gt; No public teams available at this time...</div>
              <div className="mt-2">&gt; Please check back later or use an invite code.</div>
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/team')}
          className="text-red-400/70 hover:text-red-500 font-mono text-sm transition-colors duration-300"
        >
          &lt; RETURN_TO_OPERATIONS
        </button>
      </div>
    </div>
  );
}
