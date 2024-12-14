'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Providers.js';
import Leaderboard from '@/components/Leaderboard.js';
import { io } from 'socket.io-client';
import ChallengesClient from '@/components/ChallengesClient';
import MatrixBackground from '@/components/MatrixBackground';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
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

    fetchChallenges();
  }, []);

  useEffect(() => {
    const checkCountdown = async () => {
      try {
        const response = await fetch('/api/admin/countdown');
        const data = await response.json();
        if (data.countdown) {
          const targetDate = new Date(data.countdown.targetDate);
          const now = new Date();
          setCountdownExpired(now >= targetDate);
        }
      } catch (error) {
        console.error('Error checking countdown:', error);
      }
    };

    checkCountdown();
    const interval = setInterval(checkCountdown, 1000);
    return () => clearInterval(interval);
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

  const categories = ['All', 'Web', 'Pwn', 'Reverse', 'Crypto', 'Forensics', 'Misc'];
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
    return user.solvedChallenges.some(solve => 
      solve === challenge._id.toString()
    );
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

    return (
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
                  <pre className="whitespace-pre-wrap">{challenge.description}</pre>
                </div>
              )}

              {/* Challenge Files */}
              {challenge.files && challenge.files.length > 0 && (
                <div className="font-mono text-gray-300 bg-black bg-opacity-50 p-4 rounded-lg border border-blue-500/30">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">Challenge Files</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {challenge.files.map((file, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <a 
                          href={`data:${file.type};base64,${file.data}`}
                          download={file.name}
                          className="text-blue-400 hover:underline flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {file.name}
                          <span className="text-xs text-gray-500">({(file.size/1024).toFixed(1)} KB)</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
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
    );
  };

  const ChallengeCard = ({ challenge, onSelect }) => {
    // Use the isSolved function to determine challenge status
    const solved = isSolved(challenge);

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
                  SOLVED
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
    <div className="min-h-screen bg-gray-900/70 relative">
      <MatrixBackground />
      <div className="relative z-10">
        <div className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Filters Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-xl font-semibold text-white mb-4">Filters</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    >
                      {difficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>{difficulty}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search challenges..."
                      className="w-full bg-gray-700 text-white rounded-md px-3 py-2 border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm">
                <Leaderboard />
              </div>
            </div>

            {/* Challenges Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map(challenge => (
                  <ChallengeCard 
                    key={challenge._id} 
                    challenge={challenge} 
                    onSelect={() => setSelectedChallenge(challenge)} 
                  />
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
    </div>
  );
}
