'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './Providers';
import { useTheme } from './ThemeProvider';
import Leaderboard from './Leaderboard';
import { io } from 'socket.io-client';
import ChallengeModal from './ChallengeModal';
import toast, { Toaster } from 'react-hot-toast';
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
    // Ensure socket is only initialized once
    if (!socket) {
      try {
        console.log('Initializing socket connection...');
        console.log('Current window location:', window.location);
        
        socket = io(window.location.origin, {
          path: '/api/socket',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
          console.log('Socket connected successfully:', socket.id);
          console.log('Socket connected to:', socket.io.uri);
        });

        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          console.error('Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
        });

        socket.on('disconnect', (reason) => {
          console.warn('Socket disconnected:', reason);
        });

        socket.on('challengeUpdate', (updatedChallenge) => {
          console.log('Received challenge update:', updatedChallenge);
          setChallenges(prevChallenges => 
            prevChallenges.map(challenge => 
              challenge._id === updatedChallenge._id ? updatedChallenge : challenge
            )
          );
        });

        // Handle new challenge notifications
        socket.on('challengeAdded', ({ message, challenge }) => {
          console.log('Received new challenge notification:', { message, challenge });
          
          // Add the new challenge to the list
          setChallenges(prev => [challenge, ...prev]);

          // Show browser notification if permission is granted
          if (Notification.permission === 'granted') {
            console.log('Showing browser notification');
            new Notification('New Challenge Available!', {
              body: `${challenge.title} (${challenge.category}) - ${challenge.points} points`,
              icon: '/favicon.ico'
            });
          }

          // Show toast notification
          console.log('Showing toast notification');
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      New Challenge Available!
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {challenge.title} ({challenge.category}) - {challenge.points} points
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    handleChallengeClick(challenge);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  View
                </button>
              </div>
            </div>
          ), {
            duration: 5000,
            position: 'top-right',
          });
        });

        // Request notification permission on component mount
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    }

    // Cleanup function
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Empty dependency array ensures this runs only once

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
      <Toaster />
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
              const isSolved = challenge.isSolved;
              const solvedByTeam = challenge.solvedByTeam;
              return (
                <div
                  key={challenge._id}
                  onClick={() => handleChallengeClick(challenge)}
                  className={`relative p-6 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isDark
                      ? `${isSolved ? 'bg-green-900' : solvedByTeam ? 'bg-blue-900' : 'bg-gray-800'} border ${isSolved ? 'border-green-500' : solvedByTeam ? 'border-blue-500' : 'border-red-500'}`
                      : `${isSolved ? 'bg-green-100' : solvedByTeam ? 'bg-blue-100' : 'bg-white'} border ${isSolved ? 'border-green-500' : solvedByTeam ? 'border-blue-500' : 'border-gray-300'}`
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className={`text-xl font-bold ${isSolved ? 'text-green-500' : solvedByTeam ? 'text-blue-500' : ''}`}>
                      {challenge.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isSolved && (
                        <span className="text-green-500">✓ Solved</span>
                      )}
                      {!isSolved && solvedByTeam && (
                        <span className="text-blue-500">Team Solved</span>
                      )}
                      <span className={`px-2 py-1 rounded text-sm ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        {challenge.points} pts
                      </span>
                    </div>
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
