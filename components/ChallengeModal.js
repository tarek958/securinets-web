'use client';

import { useState } from 'react';
import { useAuth } from './Providers';

export default function ChallengeModal({ challenge, onClose, onSubmit, loading, error, success, isDark }) {
  const [flag, setFlag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshUser } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSubmit(flag);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${
        isDark 
          ? 'bg-gray-900 border border-red-500' 
          : 'bg-white border border-gray-200'
        } w-full max-w-lg rounded-lg p-6 relative`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${
            isDark ? 'text-red-500 hover:text-red-400' : 'text-gray-500 hover:text-gray-400'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
          {challenge.title}
        </h2>

        <div className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>{challenge.description}</p>
          {challenge.hint && (
            <div className="mt-4">
              <h3 className={`font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>Hint:</h3>
              <p>{challenge.hint}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            placeholder="Enter flag..."
            className={`w-full px-4 py-2 rounded ${
              isDark 
                ? 'bg-gray-800 text-white border border-red-500' 
                : 'bg-white text-black border border-gray-300'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleSubmit(e);
              }
            }}
          />

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-500 text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || isSubmitting}
            className={`w-full py-2 px-4 rounded font-bold ${
              isDark
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            } ${loading || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading || isSubmitting ? 'Submitting...' : 'Submit Flag'}
          </button>
        </div>
      </div>
    </div>
  );
}
