'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import MatrixBackground from '@/components/MatrixBackground';

export default function CreateTeamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify(user)
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create team');
      }

      router.push('/team/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-red-500 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
            <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6">
              <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
                &gt; Access_Denied
              </h1>
              <p className="text-sm text-red-400/70 font-mono mt-2">
                Authentication required. Please log in to proceed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-red-500 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
          <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6">
            <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
              &gt; Team_Creation_Protocol
            </h1>
            <p className="text-sm text-red-400/70 font-mono mt-2">
              <span className="text-red-500">[</span> INITIALIZE NEW TEAM PARAMETERS <span className="text-red-500">]</span>
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25"></div>
          <form onSubmit={handleSubmit} className="relative bg-black rounded-lg p-8">
            {error && (
              <div className="mb-6 font-mono text-sm">
                <div className="text-red-500">&gt; Error detected:</div>
                <div className="text-red-400/70">&gt; {error}</div>
              </div>
            )}

            {/* Terminal-like header */}
            <div className="font-mono text-sm mb-6">
              <div className="text-red-400/70">&gt; Initializing team creation sequence...</div>
              <div className="text-red-400/70">&gt; Awaiting parameter input...</div>
            </div>

            <div className="space-y-6">
              {/* Team Name Input */}
              <div className="relative group">
                <label className="block text-sm font-mono text-red-400/70 mb-2">
                  &gt; Team_Designation:
                </label>
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-900 rounded-md blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="relative w-full bg-black border border-red-500/50 rounded-md px-4 py-3 text-red-500 font-mono placeholder-red-500/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    required
                    minLength={3}
                    maxLength={50}
                    placeholder="ENTER_TEAM_NAME"
                  />
                </div>
              </div>

              {/* Team Description Input */}
              <div className="relative group">
                <label className="block text-sm font-mono text-red-400/70 mb-2">
                  &gt; Mission_Parameters:
                </label>
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-900 rounded-md blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="relative w-full bg-black border border-red-500/50 rounded-md px-4 py-3 text-red-500 font-mono placeholder-red-500/30 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    rows="4"
                    placeholder="DESCRIBE_TEAM_OBJECTIVES"
                  />
                </div>
              </div>

              {/* Public Team Toggle */}
              <div className="relative group">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="w-10 h-5 bg-black border border-red-500/50 rounded-full shadow-inner"></div>
                    <div className={`absolute left-0 top-0 w-5 h-5 bg-red-500 rounded-full transition-transform transform ${formData.isPublic ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <span className="text-sm font-mono text-red-400/70">
                    &gt; Enable_Public_Access
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-md"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative flex items-center justify-center bg-black text-red-500 font-mono py-3 rounded-md border border-red-500/30 group-hover:border-red-500/50 transition-all duration-300">
                  {loading ? '>> INITIALIZING...' : '>> EXECUTE_CREATION'}
                </div>
              </button>
            </div>

            {/* Terminal-like status messages */}
            <div className="mt-6 font-mono text-sm text-red-400/70">
              <div>&gt; System ready for initialization...</div>
              {loading && (
                <>
                  <div>&gt; Processing request...</div>
                  <div>&gt; Establishing secure connection...</div>
                  <div className="animate-pulse">&gt; _</div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
