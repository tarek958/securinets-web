'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './Providers';
import { useTheme } from './ThemeProvider';
import Leaderboard from './Leaderboard';
import { io } from 'socket.io-client';
import ChallengeModal from './ChallengeModal';
import '../styles/hacking-effects.css';

const categories = ['All', 'Web', 'Pwn', 'Reverse', 'Crypto', 'Forensics', 'Misc'];
const difficulties = ['All', 'Easy', 'Medium', 'Hard', 'Insane'];

let socket;

export default function ChallengesClient({ initialChallenges }) {
  const { user } = useAuth();
  const { isDark, toggleTheme, glitchEffect } = useTheme();
  const [challenges, setChallenges] = useState(initialChallenges || []);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  useEffect(() => {
    socket = io('/', {
      path: '/api/socket',
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    socket.on('challengeUpdate', (updatedChallenge) => {
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => 
          challenge._id === updatedChallenge._id ? updatedChallenge : challenge
        )
      );
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const filteredChallenges = challenges.filter(challenge => {
    const matchesCategory = selectedCategory === 'All' || challenge.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || challenge.difficulty === selectedDifficulty;
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleChallengeClick = (challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleCloseModal = () => {
    setSelectedChallenge(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleFlagSubmit = async (flag) => {
    if (!selectedChallenge) {
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!user) {
      setSubmitError('You must be logged in to submit a flag');
      setSubmitLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/submit-flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeId: selectedChallenge._id,
          flag: flag
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit flag');
      }

      setSubmitSuccess('Congratulations! Flag is correct!');
      
      if (socket && socket.connected) {
        socket.emit('challengeSolved', {
          challengeId: selectedChallenge._id,
          userId: user.id,
          points: selectedChallenge.points
        });
      }

      // Refresh challenges
      const challengesResponse = await fetch('/api/challenges', {
        cache: 'no-store'
      });
      const updatedChallenges = await challengesResponse.json();
      setChallenges(updatedChallenges);

      // Close modal after successful submission
      setTimeout(() => {
        handleCloseModal();
      }, 2000);

    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <div className="scanline" />
      <div className="matrix-bg" />
      <div className={`min-h-screen ${isDark ? 'dark bg-black text-white' : 'light bg-white text-black'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className={`text-3xl font-bold ${glitchEffect ? 'glitch' : ''}`}>
              Securinets CTF Challenges
            </h1>
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg ${
                isDark 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-black'
              }`}
            >
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>

          <div className="mb-8">
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-4 py-2 rounded ${
                  isDark 
                    ? 'bg-gray-800 text-white border border-red-500' 
                    : 'bg-white text-black border border-gray-300'
                }`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className={`px-4 py-2 rounded ${
                  isDark 
                    ? 'bg-gray-800 text-white border border-red-500' 
                    : 'bg-white text-black border border-gray-300'
                }`}
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-grow px-4 py-2 rounded ${
                  isDark 
                    ? 'bg-gray-800 text-white border border-red-500' 
                    : 'bg-white text-black border border-gray-300'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => {
              const isSolved = user?.solvedChallenges?.includes(challenge._id);
              return (
                <div
                  key={challenge._id}
                  onClick={() => handleChallengeClick(challenge)}
                  className={`hacker-card p-6 rounded-lg cursor-pointer ${
                    isSolved 
                      ? isDark 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-green-600 bg-green-50'
                      : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-xl font-bold ${glitchEffect ? 'glitch' : ''}`}>
                      {challenge.title}
                    </h3>
                    {isSolved && (
                      <span className="text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className={`mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {challenge.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      isDark 
                        ? 'bg-red-900/50 text-red-200' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {challenge.category}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      isDark 
                        ? 'bg-red-900/50 text-red-200' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {challenge.points} pts
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      isDark 
                        ? 'bg-red-900/50 text-red-200' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedChallenge && (
            <ChallengeModal
              challenge={selectedChallenge}
              onClose={handleCloseModal}
              onSubmit={handleFlagSubmit}
              loading={submitLoading}
              error={submitError}
              success={submitSuccess}
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </>
  );
}
