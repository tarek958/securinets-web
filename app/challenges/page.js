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
  const [flagInput, setFlagInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

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

  const handleSubmitFlag = async (challengeId) => {
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError('Please log in to submit flags');
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id
        },
        body: JSON.stringify({ flag: flagInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Flag submission error:', data);
        throw new Error(data.message || 'Failed to submit flag');
      }

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
          points: selectedChallenge.points
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

  const ChallengeModal = ({ challenge, onClose }) => (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{challenge.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className={`inline-block px-2 py-1 text-sm font-semibold rounded-full ${getDifficultyColor(challenge.difficulty)} bg-opacity-10`}>
                {challenge.difficulty}
              </span>
              <span className="ml-2 inline-block px-2 py-1 text-sm font-semibold text-blue-500 rounded-full bg-blue-50">
                {challenge.category}
              </span>
              <span className="ml-2 inline-block px-2 py-1 text-sm font-semibold text-purple-500 rounded-full bg-purple-50">
                {challenge.points} points
              </span>
            </div>

            <p className="text-gray-600 whitespace-pre-wrap">{challenge.description}</p>

            {challenge.files && challenge.files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Files:</h3>
                <ul className="space-y-2">
                  {challenge.files.map((file, index) => (
                    <li key={index}>
                      <a
                        href={`data:${file.type};base64,${file.data}`}
                        download={file.name}
                        className="text-blue-500 hover:text-blue-600 flex items-center"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {file.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {challenge.hints && challenge.hints.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Hints:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {challenge.hints.map((hint, index) => (
                    <li key={index} className="text-gray-600">{hint}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  placeholder="Enter flag"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleSubmitFlag(challenge._id)}
                  disabled={submitLoading}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    submitLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitLoading ? 'Submitting...' : 'Submit Flag'}
                </button>
              </div>
              {submitError && (
                <p className="mt-2 text-red-500">{submitError}</p>
              )}
              {submitSuccess && (
                <p className="mt-2 text-green-500">{submitSuccess}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
                  <div
                    key={challenge._id}
                    className={`bg-gray-800/80 rounded-lg p-6 backdrop-blur-sm border-2 ${
                      isSolved(challenge) ? 'border-green-500/50' : 'border-gray-700'
                    } hover:border-red-500/50 transition-colors cursor-pointer`}
                    onClick={() => setSelectedChallenge(challenge)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {challenge.description}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-semibold">{challenge.points} pts</span>
                      <span className="text-gray-400 text-sm">
                        {challenge.solvedBy?.length || 0} solves
                      </span>
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
          onSubmit={handleSubmitFlag}
          loading={submitLoading}
          error={submitError}
          success={submitSuccess}
          isDark={true}
        />
      )}
    </div>
  );
}
