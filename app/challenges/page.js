'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Providers.js';
import Leaderboard from '@/components/Leaderboard.js';
import { io } from 'socket.io-client';
import ChallengesClient from '@/components/ChallengesClient';
import MatrixBackground from '@/components/MatrixBackground';
import { Toaster, toast } from 'react-hot-toast';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [countdownExpired, setCountdownExpired] = useState(false);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const res = await fetch('/api/challenges', {
          cache: 'no-store'
        });

        if (!res.ok) {
          throw new Error('Failed to fetch challenges');
        }

        const data = await res.json();
        
        setChallenges(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(['All', ...data]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchChallenges();
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 relative">
        <MatrixBackground />
        <div className="relative z-10 flex justify-center items-center h-screen">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading challenges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 relative">
        <MatrixBackground />
        <div className="relative z-10 flex justify-center items-center h-screen">
          <div className="text-center p-8 text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  const difficulties = ['All', 'Easy', 'Medium', 'Hard', 'Insane'];
  const filteredChallenges = challenges.filter(challenge => {
    const matchesCategory = selectedCategory === 'All' || challenge.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || challenge.difficulty === selectedDifficulty;
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-orange-500';
      case 'Insane': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const isSolved = (challenge) => {
    if (!user || !user.solvedChallenges) return false;
    
    // Check if user has solved it directly
    const userSolved = user.solvedChallenges.some(solve => 
      solve === challenge._id.toString()
    );

    // If user solved it, return true
    if (userSolved) return true;

    // Check if it's solved by team
    return challenge.solvedByTeam === true;
  };

  const ChallengeModal = ({ challenge, onClose }) => {
    const [flagInput, setFlagInput] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);
    const [showWriteupEditor, setShowWriteupEditor] = useState(false);
    const [writeupContent, setWriteupContent] = useState(challenge.writeup || '');
    const [saveWriteupLoading, setSaveWriteupLoading] = useState(false);

    const handleFlagInputChange = (e) => {
      const value = e.target.value;
      setFlagInput(value);
    };

    const handleSubmitFlag = async (challengeId) => {
      try {
        setSubmitLoading(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        if (!user) {
          setSubmitError('Please log in to submit flags');
          setSubmitLoading(false);
          return;
        }

        const countdownResponse = await fetch('/api/admin/countdown');
        const countdownData = await countdownResponse.json();
        if (countdownData.countdown) {
          const targetDate = new Date(countdownData.countdown.targetDate);
          const now = new Date();
          const isExpired = now >= targetDate;
          setCountdownExpired(isExpired);
          
          if (isExpired) {
            setSubmitError('The CTF has ended. Flag submissions are no longer accepted.');
            setSubmitLoading(false);
            return;
          }
        }

        if (countdownExpired) {
          setSubmitError('The CTF has ended. Flag submissions are no longer accepted.');
          setSubmitLoading(false);
          return;
        }

        const response = await fetch(`/api/challenges/${challengeId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': user.id
          },
          body: JSON.stringify({ flag: flagInput.trim() }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          const errorMessage = errorText.toLowerCase().includes('incorrect') 
            ? 'The flag is incorrect' 
            : (errorText || 'Failed to submit flag');
          
          setSubmitError(errorMessage);
          return;
        }

        const data = await response.json();

        setSubmitSuccess(data.message);
        setFlagInput('');
        
        // Emit socket event for leaderboard update
        const socket = io('/', {
          path: '/api/socket',
        });
        if (socket && socket.connected) {
          socket.emit('flag-submitted', {
            userId: user.id,
            challengeId: challengeId,
            points: challenge.points
          });
        }

        // Refresh challenges to update solved status
        const response2 = await fetch('/api/challenges', {
          cache: 'no-store'
        });
        const challenges2 = await response2.json();

        // Close modal after successful submission
        setTimeout(() => {
          setSelectedChallenge(null);
          setSubmitSuccess(null);
        }, 2000);

      } catch (err) {
        setSubmitError(err.message);
      } finally {
        setSubmitLoading(false);
      }
    };

    const handleSaveWriteup = async () => {
      if (!user?.role === 'admin') return;
      
      try {
        setSaveWriteupLoading(true);
        const response = await fetch('/api/writeups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            challengeId: challenge._id,
            writeup: writeupContent,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setShowWriteupEditor(false);
          // Update the challenge in state with new writeup
          setChallenges(prevChallenges => 
            prevChallenges.map(c => 
              c._id === challenge._id 
                ? { ...c, writeup: writeupContent }
                : c
            )
          );
        } else {
          setSubmitError(data.error || 'Failed to save writeup');
        }
      } catch (error) {
        setSubmitError('Failed to save writeup');
      } finally {
        setSaveWriteupLoading(false);
      }
    };

    const handleDownload = async (file) => {
      if (file.isBase64) {
        // Handle base64 file
        const link = document.createElement('a');
        link.href = `data:${file.type};base64,${file.data}`;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Handle stored file
        try {
          if (!user || !user.id) {
            toast.error('Please log in to download files');
            return;
          }

          // First fetch to get download URL with auth
          const authResponse = await fetch('/api/challenges/download-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filename: file.filename || file.name // Try filename first, fallback to name
            }),
            credentials: 'include'
          });

          if (!authResponse.ok) {
            const errorData = await authResponse.json();
            throw new Error(errorData.error || 'Failed to authenticate download');
          }

          const { downloadUrl } = await authResponse.json();

          // Now download the file
          const response = await fetch(downloadUrl, {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Failed to download file');
          }

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.originalName || file.name; // Use originalName for display if available
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Download error:', error);
          toast.error(error.message || 'Failed to download file');
        }
      }
    };

    const renderFileList = (files) => {
      if (!files || files.length === 0) return null;
      
      return (
        <div className="mt-4">
          <h3 className="text-lg font-bold text-green-400 mb-2">Files</h3>
          <ul className="list-disc list-inside">
            {files.map((file, index) => (
              <li key={index} className="text-gray-300">
                <button
                  onClick={() => handleDownload(file)}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  {file.name}
                </button>
                <span className="text-gray-500 text-sm ml-2">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-[150] overflow-hidden"
        aria-labelledby="modal-title" 
        role="dialog" 
        aria-modal="true"
      >
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 overflow-hidden">
          <div className="relative bg-[#0a0a0a] border-2 border-red-500 rounded-xl shadow-2xl shadow-red-900/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 hover:scale-[1.01]">
            {/* Glitch effect overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 animate-glitch-anim">
              <div className="absolute inset-0 bg-red-500 mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-crimson-500 mix-blend-color-dodge opacity-30"></div>
            </div>
 　 　 <div className="relative p-6 space-y-4 text-red-300">
              {/* Header with terminal-like styling */}
              <div className="flex justify-between items-center border-b-2 border-red-800 pb-3 mb-4">
                <h2 className="text-2xl font-mono font-bold text-red-400 tracking-wider uppercase">
                  {challenge.title}
                  <span className="text-xs ml-2 text-red-600">[CTF CHALLENGE]</span>
                </h2>
                <button
                  onClick={onClose}
                  className="text-red-500 hover:text-red-200 transition-colors duration-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Challenge Tags with hacker-style design */}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-lg text-sm font-mono ${getDifficultyColor(challenge.difficulty)} bg-opacity-20 border border-current`}>
                    {challenge.difficulty}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-sm font-mono text-blue-500 bg-opacity-20 border border-current">
                    {challenge.category}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-sm font-mono text-purple-500 bg-opacity-20 border border-current">
                    {challenge.points} pts
                  </span>
                </div>

                {/* Description */}
                {challenge.description && (
                  <div className="font-mono text-gray-300 bg-black bg-opacity-50 p-4 rounded-lg border border-red-500/30">
                    <h3 className="text-lg font-bold text-red-400 mb-2">Challenge Description</h3>
                    <pre className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{challenge.description}</pre>
                  </div>
                )}

                {/* Hints */}
                {challenge.hints && challenge.hints.length > 0 && (
                  <div className="font-mono text-gray-300 bg-black bg-opacity-50 p-4 rounded-lg border border-yellow-500/30">
                    <h3 className="text-lg font-bold text-yellow-400 mb-2">Hints</h3>
                    <div className="space-y-2">
                      {challenge.hints.map((hint, index) => (
                        <div key={index} className="p-2 bg-black/40 rounded border border-yellow-500/20">
                          <pre className="whitespace-pre-wrap break-words overflow-wrap-anywhere text-yellow-300/80">
                            {hint.content}
                          </pre>
                          {hint.cost > 0 && (
                            <div className="mt-1 text-sm text-yellow-500/60">
                              Cost: {hint.cost} points
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenge Files */}
                {challenge.files && challenge.files.length > 0 && (
                  renderFileList(challenge.files)
                )}

              </div>

              {/* Flag submission with terminal-like input */}
              <div className="mt-6 space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={flagInput}
                    onChange={handleFlagInputChange}
                    placeholder="Enter flag"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    onFocus={(e) => e.target.select()}
                    className="flex-1 px-3 py-2 bg-black text-red-300 border-2 border-red-800 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={() => handleSubmitFlag(challenge._id)}
                    disabled={submitLoading}
                    className={`px-4 py-2 bg-red-700 text-white font-mono rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      submitLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitLoading ? 'SUBMITTING...' : 'SUBMIT FLAG'}
                  </button>
                </div>
                {submitError && (
                  <p className="text-red-400 font-mono text-sm">
                    [ERROR] {submitError}
                  </p>
                )}
                {submitSuccess && (
                  <p className="text-green-500 font-mono text-sm">
                    [SUCCESS] {submitSuccess}
                  </p>
                )}
              </div>
               {/* Solved Teams */}
               <div className="font-mono text-gray-300 bg-black bg-opacity-50 p-4 rounded-lg border border-green-500/30">
                  <h3 className="text-lg font-bold text-green-400 mb-2">Teams Solved</h3>
                  <ul className="list-disc list-inside">
                    {challenge.solvedTeams.map((team) => (
                      <li key={team.id}>{team.name}</li>
                    ))}
                  </ul>
                </div>

            </div>
          </div>
        </div>
      </div>
    );
  };

  const ChallengeCard = ({ challenge, onSelect }) => {
    // Check both user solves and team solves
    const userSolved = user?.solvedChallenges?.some(solve => solve === challenge._id.toString()) || false;
    
    // Check if challenge is solved by user's team
    const isTeamSolved = challenge.solvedTeams?.some(
      solvedTeam => solvedTeam.id === user?.team?.id
    ) || false;
    
    
    const solved = userSolved || isTeamSolved;

    return (
      <div 
        className={`
          relative cursor-pointer transition-all duration-300
          ${solved 
            ? 'bg-green-900/30 border-2 border-green-800' 
            : 'bg-[#0a0a0a] border-2 border-red-800'
          }
          rounded-xl overflow-hidden shadow-md 
          ${solved 
            ? 'shadow-green-900/30' 
            : 'shadow-red-900/30'
          }
          hover:scale-[1.02]
          group
        `}
        onClick={() => onSelect(challenge)}
      >
        {/* Glitch effect overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden animate-glitch-anim">
          <div className={`absolute inset-0 ${solved ? 'bg-green-500' : 'bg-red-500'} mix-blend-overlay`}></div>
          <div className={`absolute inset-0 ${solved ? 'bg-green-300' : 'bg-crimson-500'} mix-blend-color-dodge opacity-30`}></div>
        </div>

        {/* Challenge Card Content */}
        <div className="relative p-5 space-y-3">
          {/* Challenge Title with Terminal-like Styling */}
          <div className="flex justify-between items-center">
            <h2 className={`
              text-xl font-mono font-bold tracking-wider uppercase
              ${solved ? 'text-green-400' : 'text-red-400'}
            `}>
              {challenge.title}
              {solved && (
                <span className="ml-2 text-xs bg-green-700 text-white px-2 py-1 rounded-full">
                  {userSolved ? 'SOLVED' : 'TEAM SOLVED'}
                </span>
              )}
            </h2>
            <div className="flex space-x-2">
              {/* Difficulty Tag */}
              <span className={`
                inline-block px-2 py-1 text-xs font-mono rounded-sm 
                ${getDifficultyColor(challenge.difficulty)} 
                border border-opacity-50
              `}>
                {challenge.difficulty ? challenge.difficulty.toUpperCase() : 'UNKNOWN'}
              </span>
              {/* Points Tag */}
              <span className={`
                inline-block px-2 py-1 text-xs font-mono 
                ${solved 
                  ? 'text-green-300 bg-green-900/50 border-green-700' 
                  : 'text-purple-300 bg-purple-900/50 border-purple-700'
                } 
                rounded-sm border border-opacity-50
              `}>
                {challenge.points} PTS
              </span>
            </div>
          </div>

          {/* Challenge Description */}
          <p className={`
            font-mono text-sm line-clamp-3 opacity-80
            ${solved ? 'text-green-300' : 'text-red-300'}
          `}>
            {challenge.description}
          </p>

          {/* Category and Solved By */}
          <div className="flex justify-between items-center text-xs font-mono">
            <span className={`
              px-2 py-1 rounded-sm border border-opacity-50
              ${solved 
                ? 'text-green-400 bg-green-900/30 border-green-700' 
                : 'text-red-500 bg-blue-900/30 border-blue-700/50'
              }
            `}>
              {challenge.category}
            </span>
            <span className={`
              px-2 py-1 rounded-sm border border-opacity-50
              ${solved ? 'text-green-400' : 'text-red-400'}
            `}>
              Solved by {challenge.solvedCount || 0}
            </span>
          </div>
        </div>

        {/* Hover Indicator */}
        <div className={`
          absolute bottom-0 left-0 right-0 h-1 origin-left 
          scale-x-0 group-hover:scale-x-100 transition-transform duration-300
          ${solved ? 'bg-green-600' : 'bg-red-600'}
        `}>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen relative">
      <MatrixBackground className="fixed inset-0" />
      <Toaster position="top-center" />
      <div className="relative z-10">
        <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Filters Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-black/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-red-500 mb-4 font-mono glow-text">Filters</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-red-400/80 mb-2 font-mono">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-black/60 text-red-400 rounded-md px-3 py-2 border border-red-500/30 focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                    >
                      {categories.map(category => (
                        <option key={category} value={category} className="bg-black">
                          {category === 'All' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-400/80 mb-2 font-mono">
                      Difficulty
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full bg-black/60 text-red-400 rounded-md px-3 py-2 border border-red-500/30 focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty} className="bg-black">
                          {difficulty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-400/80 mb-2 font-mono">
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search challenges..."
                      className="w-full bg-black/60 text-red-400 rounded-md px-3 py-2 border border-red-500/30 focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono placeholder-red-400/50"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-6">
                
                <Leaderboard />
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="lg:col-span-3">
              <div className="space-y-8">
                {Array.from(new Set(filteredChallenges.map(c => c.category))).map(category => (
                  <div key={category}>
                    <h3 className="text-2xl font-bold text-red-500 mb-4 font-mono glow-text">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredChallenges
                        .filter(challenge => challenge.category === category)
                        .map(challenge => (
                          <ChallengeCard 
                            key={challenge._id} 
                            challenge={challenge} 
                            onSelect={() => setSelectedChallenge(challenge)} 
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </main>
  );
}
