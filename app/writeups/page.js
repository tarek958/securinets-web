'use client';

import { useState, useEffect } from 'react';
import { FaLock, FaUnlock, FaEdit, FaSave } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function WriteupsPage() {
  const [writeups, setWriteups] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchWriteups();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
  };

  const fetchWriteups = async () => {
    try {
      const response = await fetch('/api/writeups');
      const data = await response.json();
      
      if (data.success) {
        setWriteups(data.data);
      } else {
        setError(data.error || 'Failed to fetch writeups');
      }
    } catch (err) {
      setError('Failed to fetch writeups');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWriteup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/writeups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeId: selectedChallenge._id,
          writeup: editContent,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setWriteups(writeups.map(w => 
          w._id === selectedChallenge._id 
            ? { ...w, writeup: editContent }
            : w
        ));
        setEditMode(false);
      } else {
        setError(data.error || 'Failed to save writeup');
      }
    } catch (err) {
      setError('Failed to save writeup');
    }
  };

  const handleEditClick = () => {
    setEditContent(selectedChallenge.writeup || '');
    setEditMode(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-pulse flex justify-center items-center space-x-4">
              <div className="h-12 w-12 bg-red-500 rounded-full"></div>
              <div className="h-4 bg-red-500 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-red-500">
            <h2 className="text-xl font-semibold">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Challenge Writeups</h1>
          <p className="mt-2 text-gray-400">Learn from solved challenges</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Challenge List */}
          <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Challenges</h2>
            <div className="space-y-2">
              {writeups.map((challenge) => (
                <button
                  key={challenge._id}
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setEditMode(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedChallenge?._id === challenge._id
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{challenge.title}</h3>
                      <p className="text-sm text-gray-400">
                        {challenge.category} • {challenge.points} pts
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {challenge.solveCount} solves
                      </span>
                      {challenge.writeup ? (
                        <FaUnlock className="text-green-500" />
                      ) : (
                        <FaLock className="text-red-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Writeup Display */}
          <div className="lg:col-span-2">
            {selectedChallenge ? (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedChallenge.title}
                  </h2>
                  {user?.role === 'admin' && (
                    <button
                      onClick={editMode ? handleSaveWriteup : handleEditClick}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {editMode ? (
                        <>
                          <FaSave />
                          <span>Save</span>
                        </>
                      ) : (
                        <>
                          <FaEdit />
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <span className="inline-block bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm mr-2">
                    {selectedChallenge.category}
                  </span>
                  <span className="inline-block bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm mr-2">
                    {selectedChallenge.difficulty}
                  </span>
                  <span className="inline-block bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm">
                    {selectedChallenge.points} points
                  </span>
                </div>

                {editMode ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-96 p-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Write your writeup in Markdown..."
                  />
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {selectedChallenge.writeup || '*No writeup available yet*'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-center h-full">
                <p className="text-gray-400 text-lg">
                  Select a challenge to view its writeup
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
