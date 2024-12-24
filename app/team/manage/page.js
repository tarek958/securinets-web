'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserPlus, FaUserMinus, FaCheck, FaTimes, FaUsers, FaSignOutAlt, FaEdit, FaTrash } from 'react-icons/fa';
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
  const [isEditing, setIsEditing] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        router.push('/team');
      } else {
        toast.error(data.message || 'Failed to leave team');
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };

  const handleUpdateTeamName = async () => {
    if (!newTeamName.trim()) {
      toast.error('Team name cannot be empty');
      return;
    }

    try {
      const response = await fetch('/api/teams/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id,
          name: newTeamName.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Team name updated successfully');
        setTeam(data.team);
        setIsEditing(false);
      } else {
        toast.error(data.message || 'Failed to update team name');
      }
    } catch (error) {
      console.error('Error updating team name:', error);
      toast.error('Failed to update team name');
    }
  };

  const handleDeleteTeam = async () => {
    try {
      const response = await fetch('/api/teams/update', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: team._id
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Team deleted successfully');
        router.push('/team');
      } else {
        toast.error(data.message || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-opacity-90 text-red-500 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
            <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6 flex items-center">
              <div className="mr-6">
                <FaUsers className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
                  &gt; Team_Management_Console
                </h1>
                <p className="text-sm text-red-400/70 font-mono mt-1">
                  <span className="text-red-500">[</span> SYSTEM STATUS: ONLINE <span className="text-red-500">]</span>
                </p>
              </div>
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] bg-opacity-90 text-red-500 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
            <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6 flex items-center">
              <div className="mr-6">
                <FaUsers className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
                  &gt; Team_Management_Console
                </h1>
                <p className="text-sm text-red-400/70 font-mono mt-1">
                  <span className="text-red-500">[</span> SYSTEM STATUS: ONLINE <span className="text-red-500">]</span>
                </p>
              </div>
            </div>
          </div>
          <p className="font-mono text-center">{error || 'No team data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-opacity-90 text-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
          <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6 flex items-center">
            <div className="mr-6">
              <FaUsers className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
                &gt; Team_Management_Console
              </h1>
              <p className="text-sm text-red-400/70 font-mono mt-1">
                <span className="text-red-500">[</span> SYSTEM STATUS: ONLINE <span className="text-red-500">]</span>
              </p>
            </div>
          </div>
        </div>

        {/* Team Configuration Section */}
        <div className="relative mb-8 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-black rounded-lg">
            {/* Header Bar */}
            <div className="border-l-4 border-red-500 bg-black/60 backdrop-blur-md p-4 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                  &gt; Team_Configuration
                </h2>
              </div>
              <div className="flex items-center space-x-2 text-sm text-red-400/70 font-mono">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span>ACTIVE</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Team Name Section */}
              <div className="relative group/name">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/50 to-red-900/50 rounded-lg blur opacity-0 group-hover/name:opacity-25 transition duration-500"></div>
                <div className="relative bg-black/40 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <FaEdit className="h-4 w-4 text-red-500" />
                      </div>
                      <p className="font-mono text-sm text-red-400/70">Team Name Configuration</p>
                    </div>
                    {isLeader && !isEditing && (
                      <button
                        onClick={() => {
                          setNewTeamName(team.name);
                          setIsEditing(true);
                        }}
                        className="group/edit relative px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300 font-mono text-sm inline-flex items-center space-x-2"
                      >
                        <span>EDIT</span>
                        <FaEdit className="h-4 w-4 transform group-hover/edit:rotate-12 transition-transform" />
                        <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover/edit:opacity-100 transition-opacity duration-300 -z-10"></div>
                      </button>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="relative">
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="flex-1 bg-[#1a1a1a] border-2 border-red-500/20 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-red-500/50 transition-colors duration-300"
                          placeholder="Enter new team name"
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleUpdateTeamName}
                            className="group/save relative p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300"
                            title="Save"
                          >
                            <FaCheck className="h-4 w-4 transform group-hover/save:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover/save:opacity-100 transition-opacity duration-300 -z-10"></div>
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="group/cancel relative p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-300"
                            title="Cancel"
                          >
                            <FaTimes className="h-4 w-4 transform group-hover/cancel:rotate-90 transition-transform" />
                            <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover/cancel:opacity-100 transition-opacity duration-300 -z-10"></div>
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 font-mono text-xs text-red-400/60">Press Enter to save, Esc to cancel</div>
                    </div>
                  ) : (
                    <div className="relative group/display">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-900/5 rounded-lg"></div>
                      <div className="relative bg-[#1a1a1a] rounded-lg p-4 border border-red-500/20 group-hover/display:border-red-500/40 transition-colors duration-300">
                        <p className="font-mono text-2xl text-white tracking-wide">{team.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Stats */}
              <div className="relative group/stats">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/50 to-red-900/50 rounded-lg blur opacity-0 group-hover/stats:opacity-25 transition duration-500"></div>
                <div className="relative bg-black/40 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <FaUsers className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="font-mono text-sm text-red-400/70">Team Statistics</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-red-500/20 group-hover/stats:border-red-500/40 transition-colors duration-300">
                      <p className="font-mono text-sm text-red-400/70 mb-2">Active Members</p>
                      <p className="font-mono text-2xl text-white">{team.members?.length || 1}/4</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-red-500/20 group-hover/stats:border-red-500/40 transition-colors duration-300">
                      <p className="font-mono text-sm text-red-400/70 mb-2">Team Status</p>
                      <p className="font-mono text-2xl text-white flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span>ACTIVE</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              {isLeader && (
                <div className="relative group/danger">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/50 to-red-900/50 rounded-lg blur opacity-0 group-hover/danger:opacity-25 transition duration-500"></div>
                  <div className="relative bg-black/40 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <FaTrash className="h-4 w-4 text-red-500" />
                      </div>
                      <h3 className="font-mono text-red-500">&gt; Danger_Zone</h3>
                    </div>
                    
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="group/delete relative w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-3 rounded-lg transition-all duration-300 font-mono inline-flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <FaTrash className="h-4 w-4" />
                          <span>DELETE TEAM</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover/delete:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover/delete:opacity-100 transition-opacity duration-300 -z-10"></div>
                      </button>
                    ) : (
                      <div className="bg-[#1a1a1a] border-2 border-red-500/20 rounded-lg p-6 space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-red-500/10 rounded-lg mt-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="font-mono text-lg text-red-500 mb-2">WARNING: Destructive Action</p>
                            <p className="font-mono text-sm text-red-400/70 leading-relaxed">
                              You are about to permanently delete this team. This action cannot be undone. 
                              All team data, including member associations, will be permanently removed.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 pt-2">
                          <button
                            onClick={handleDeleteTeam}
                            className="group/confirm relative flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-all duration-300 font-mono inline-flex items-center justify-center space-x-2"
                          >
                            <FaTrash className="h-4 w-4" />
                            <span>CONFIRM DELETE</span>
                            <div className="absolute inset-0 bg-red-400/20 rounded-lg blur opacity-0 group-hover/confirm:opacity-100 transition-opacity duration-300 -z-10"></div>
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="group/cancel flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-6 py-3 rounded-lg transition-all duration-300 font-mono"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Requests Section */}
        {isLeader && (
          <div className="relative mb-8 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-black rounded-lg">
              {/* Header Bar */}
              <div className="border-l-4 border-red-500 bg-black/60 backdrop-blur-md p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <FaUserPlus className="h-5 w-5 text-red-500" />
                  </div>
                  <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                    &gt; Pending_Requests
                  </h2>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-red-400/70">[</span>
                  <span className="text-sm font-mono text-red-500">{pendingRequests.length}</span>
                  <span className="text-sm font-mono text-red-400/70">]</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {pendingRequests.length === 0 ? (
                  <div className="bg-[#1a1a1a] border border-red-500/20 rounded-lg p-6 text-center">
                    <p className="font-mono text-red-400/70">No pending requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request._id}
                        className="group/request relative overflow-hidden"
                      >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/30 to-red-900/30 rounded-lg blur opacity-0 group-hover/request:opacity-25 transition duration-500"></div>
                        <div className="relative bg-[#1a1a1a] border border-red-500/20 group-hover/request:border-red-500/40 rounded-lg p-4 flex items-center justify-between transition-colors duration-300">
                          <div className="flex items-center space-x-4">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <div>
                              <p className="font-mono text-lg text-white">{request.username}</p>
                              <p className="font-mono text-sm text-red-400/70">{request.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleRequest(request._id, 'accept')}
                              className="group/accept relative px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-all duration-300 font-mono text-sm inline-flex items-center space-x-2"
                            >
                              <FaCheck className="h-4 w-4" />
                              <span>ACCEPT</span>
                              <div className="absolute inset-0 bg-green-500/10 rounded-lg blur opacity-0 group-hover/accept:opacity-100 transition-opacity duration-300 -z-10"></div>
                            </button>
                            <button
                              onClick={() => handleRequest(request._id, 'reject')}
                              className="group/reject relative px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300 font-mono text-sm inline-flex items-center space-x-2"
                            >
                              <FaTimes className="h-4 w-4" />
                              <span>REJECT</span>
                              <div className="absolute inset-0 bg-red-500/10 rounded-lg blur opacity-0 group-hover/reject:opacity-100 transition-opacity duration-300 -z-10"></div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
