'use client';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { UsersIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TeamDashboard() {
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(null);

  // Fetch team data
  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/teams/my-team');
      const data = await response.json();
      
      if (data.success) {
        console.log('Team data:', data.team);
        setTeam(data.team);
        // Set isLeader based on team data
        const currentMember = data.team.members.find(member => !data.team.leaderId || member._id !== data.team.leaderId);
        setIsLeader(!!currentMember && currentMember._id === data.team.leaderId);
        // Set pending requests directly from team data
        setPendingRequests(data.team.pendingMembers || []);
      } else {
        setError(data.message || 'Failed to fetch team data');
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  // Handle request action (accept/reject)
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

  // Generate new invite code
  const generateInviteCode = async () => {
    try {
      setStatusMessage({ text: 'Generating new invite code...', type: 'info' });
      const response = await fetch('/api/teams/generate-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchTeamData();
        setStatusMessage({ text: 'New invite code generated successfully!', type: 'success' });
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
      } else {
        setStatusMessage({ text: data.message || 'Failed to generate invite code', type: 'error' });
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      setStatusMessage({ text: 'Failed to generate invite code', type: 'error' });
    }
  };

  // Copy invite code to clipboard
  const copyInviteCode = async () => {
    if (!team?.inviteCode || !isClient) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(team.inviteCode);
        setStatusMessage({ text: 'Invite code copied to clipboard!', type: 'success' });
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = team.inviteCode;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setStatusMessage({ text: 'Invite code copied to clipboard!', type: 'success' });
        } catch (err) {
          setStatusMessage({ text: 'Failed to copy invite code', type: 'error' });
          console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setStatusMessage({ text: 'Failed to copy invite code', type: 'error' });
    }
    
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
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
    try {
      // Get current member from team members
      const currentMember = team.members.find(member => !team.leaderId || member._id !== team.leaderId);
      if (!currentMember) {
        toast.error('Could not identify your membership');
        return;
      }

      const response = await fetch('/api/teams/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id,
          memberId: currentMember._id,
          action: 'leave'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('You have left the team');
        router.push('/team');
      } else {
        toast.error(data.message || 'Failed to leave team');
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const userData = JSON.parse(storedUserData);
      const userId = userData.sub || userData._id || userData.id;
    
      setIsLeader(team?.leaderId === userId);
    }
    fetchTeamData();
  }, [team?.leaderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-opacity-90 text-red-500 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Team Dashboard</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-opacity-90 text-red-500 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Team Dashboard</h1>
          <p className="text-red-500">{error || 'Team not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-opacity-90 text-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Status Message */}
        {statusMessage.text && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            statusMessage.type === 'success' 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            <p className="font-mono">
              {statusMessage.type === 'success' && '✓ '}
              {statusMessage.text}
            </p>
          </div>
        )}

        {/* Header Section */}
        <div className="relative mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
          <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
                  &gt; Team_Dashboard
                </h1>
                <p className="text-sm text-red-400/70 font-mono mt-1">
                  <span className="text-red-500">[</span> SYSTEM STATUS: ONLINE <span className="text-red-500">]</span>
                </p>
              </div>
            </div>
            <div>
              <Link
                href="/team/manage"
                className="group relative inline-flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300 font-mono text-sm"
              >
                <span>MANAGE TEAM</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Team Info Card */}
          <div className="lg:col-span-2">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-black rounded-lg">
                <div className="border-l-4 border-red-500 bg-black/60 backdrop-blur-md p-4 rounded-t-lg flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                      &gt; Team_Info
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="font-mono text-sm text-red-400/70">Team Name</div>
                      <div className="font-mono text-2xl text-white bg-[#1a1a1a] rounded-lg p-4 border border-red-500/20">
                        {team?.name || 'Loading...'}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="font-mono text-sm text-red-400/70">Team Status</div>
                      <div className="font-mono text-2xl text-white bg-[#1a1a1a] rounded-lg p-4 border border-red-500/20 flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>ACTIVE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Stats Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-black rounded-lg h-full">
              <div className="border-l-4 border-red-500 bg-black/60 backdrop-blur-md p-4 rounded-t-lg flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 015.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                    &gt; Stats
                  </h2>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-[#1a1a1a] rounded-lg p-4 border border-red-500/20">
                  <div className="font-mono text-sm text-red-400/70 mb-2">Members</div>
                  <div className="font-mono text-3xl text-white">{team?.members?.length || 0}/4</div>
                </div>
               
              </div>
            </div>
          </div>
        </div>

        {/* Access Code Section */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-black rounded-lg">
            <div className="border-l-4 border-red-500 bg-black/60 backdrop-blur-md p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                  &gt; Access_Code
                </h2>
              </div>
              {isLeader && (
                <button
                  onClick={generateInviteCode}
                  className="group relative px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300 font-mono text-sm inline-flex items-center space-x-2"
                >
                  <span>GENERATE NEW CODE</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
            </div>
            <div className="p-6">
              <div className="bg-[#1a1a1a] rounded-lg p-4 border border-red-500/20 flex items-center justify-between">
                <div className="font-mono text-xl text-white tracking-wider">{team?.inviteCode || 'No invite code available'}</div>
                {team?.inviteCode && (
                  <button
                    onClick={copyInviteCode}
                    className="group relative p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300"
                    title="Copy code"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-black rounded-lg">
            <div className="border-l-4 border-red-500 bg-black/60 backdrop-blur-md p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                  &gt; Team_Members
                </h2>
              </div>
              {!isLeader && (
                <button
                  onClick={handleLeaveTeam}
                  className="group relative px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300 font-mono text-sm inline-flex items-center space-x-2"
                >
                  <span>LEAVE TEAM</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {team?.members?.map((member) => {
                  const memberId = member._id.toString();
                  return (
                    <div
                      key={memberId}
                      className="group/member relative overflow-hidden"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/30 to-red-900/30 rounded-lg blur opacity-0 group-hover/member:opacity-25 transition duration-500"></div>
                      <div className="relative bg-[#1a1a1a] border border-red-500/20 group-hover/member:border-red-500/40 rounded-lg p-4 flex items-center justify-between transition-colors duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <div>
                            <p className="font-mono text-lg text-white">{member.username}</p>
                            <p className="font-mono text-sm text-red-400/70">
                              {memberId === team.leaderId ? '[TEAM LEADER]' : '[OPERATIVE]'}
                            </p>
                          </div>
                        </div>
                        {isLeader && memberId !== team.leaderId && (
                          <button
                            onClick={() => handleRemoveMember(memberId)}
                            className="group/remove relative px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300 font-mono text-sm inline-flex items-center space-x-2"
                          >
                            <span>REMOVE</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover/remove:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover/remove:opacity-100 transition-opacity duration-300 -z-10"></div>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
