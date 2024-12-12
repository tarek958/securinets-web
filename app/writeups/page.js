'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { FaLock, FaUnlock, FaEdit, FaSave, FaPlus, FaTerminal, FaSkull } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/components/Providers';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import './writeup.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

export default function WriteupsPage() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const getAuthHeader = () => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
    const token = authCookie ? authCookie.split('=')[1].trim() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setChallenges(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to fetch challenges');
      setLoading(false);
    }
  };

  const handleSaveWriteup = async () => {
    if (!selectedChallenge) return;
    if (!user || user.role !== 'admin') {
      alert('Access Denied: Admin privileges required.');
      return;
    }

    try {
      const response = await fetch('/api/writeups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          challengeId: selectedChallenge._id,
          writeup: editContent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setChallenges(challenges.map(challenge => 
          challenge._id === selectedChallenge._id 
            ? { ...challenge, writeup: editContent }
            : challenge
        ));
        setEditMode(false);
      } else {
        alert('Operation Failed: ' + (data.error || 'Unknown error occurred'));
      }
    } catch (err) {
      alert('System Error: Failed to save writeup');
      console.error('Save error:', err);
    }
  };

  const handleDeleteWriteup = async () => {
    if (!selectedChallenge) return;
    if (!user || user.role !== 'admin') {
      alert('Access Denied: Admin privileges required.');
      return;
    }

    if (!confirm('[WARNING] Confirm deletion of writeup. This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/writeups', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          challengeId: selectedChallenge._id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setChallenges(challenges.map(challenge => 
          challenge._id === selectedChallenge._id 
            ? { ...challenge, writeup: '' }
            : challenge
        ));
        setEditMode(false);
        setEditContent('');
        alert('[SUCCESS] Writeup successfully eliminated from the system.');
      } else {
        alert('[ERROR] ' + (data.error || 'Operation failed'));
      }
    } catch (err) {
      alert('[CRITICAL] System error during deletion');
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-mono font-bold mb-8 flex items-center">
            <FaTerminal className="mr-2" />
            &gt; CTF_Writeups_Terminal
          </h1>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-mono font-bold mb-8 flex items-center">
            <FaSkull className="mr-2" />
            &gt; System_Error
          </h1>
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
            <p className="font-mono">[ERROR] {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-red-500 p-8" data-color-mode="dark">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 flex items-center">
          <FaTerminal className="mr-2" />
          &gt; CTF_Writeups_Terminal
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Challenge List */}
          <div className="md:col-span-1 bg-gray-900 border border-red-500/50 p-4 rounded-lg">
            <h2 className="text-xl font-mono font-semibold mb-4 flex items-center">
              <FaLock className="mr-2" />
              &gt; Target_List
            </h2>
            <div className="space-y-2">
              {challenges.map((challenge) => (
                <button
                  key={challenge._id}
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setEditContent(challenge.writeup || '');
                    setEditMode(false);
                  }}
                  className={`w-full text-left p-3 rounded font-mono ${
                    selectedChallenge?._id === challenge._id
                      ? 'bg-red-900/50 border border-red-500'
                      : 'bg-gray-800 border border-red-500/30 hover:bg-red-900/30'
                  }`}
                >
                  <div className="flex items-center">
                    {challenge.writeup ? <FaUnlock className="mr-2" /> : <FaLock className="mr-2" />}
                    &gt; {challenge.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Writeup Content */}
          <div className="md:col-span-3 bg-gray-900 border border-red-500/50 p-4 rounded-lg">
            {selectedChallenge ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-mono font-semibold flex items-center">
                    <FaTerminal className="mr-2" />
                    &gt; {selectedChallenge.title}_writeup
                  </h2>
                  {user?.role === 'admin' && (
                    <div className="space-x-2">
                      {editMode ? (
                        <button
                          onClick={handleSaveWriteup}
                          className="px-4 py-2 bg-red-500/10 text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
                        >
                          <FaSave className="mr-2" />
                          [SAVE]
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditMode(true)}
                          className="px-4 py-2 bg-red-500/10 text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
                        >
                          <FaEdit className="mr-2" />
                          [EDIT]
                        </button>
                      )}
                      {selectedChallenge.writeup && (
                        <button
                          onClick={handleDeleteWriteup}
                          className="px-4 py-2 bg-red-900/30 text-red-500 rounded border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono inline-flex items-center"
                        >
                          <FaSkull className="mr-2" />
                          [DELETE]
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editMode ? (
                  <div className="bg-gray-800 rounded-lg p-4 border border-red-500/30">
                    <MDEditor
                      value={editContent}
                      onChange={setEditContent}
                      preview="edit"
                      className="writeup-editor"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-4 border border-red-500/30 prose prose-invert max-w-none">
                    {selectedChallenge.writeup ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedChallenge.writeup}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-red-500/70 font-mono">
                        [NO_WRITEUP_FOUND] This challenge has not been documented yet.
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-red-500/70 font-mono">
                <p>&gt; Select a challenge to view its writeup</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
