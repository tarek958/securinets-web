'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import TeamManagement from '../components/TeamManagement';

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasTeam, setHasTeam] = useState(false);
  const [checkingTeam, setCheckingTeam] = useState(true);

  useEffect(() => {
    const checkTeam = async () => {
      try {
        const response = await fetch('/api/teams/my-team');
        const data = await response.json();
        if (data.success) {
          setHasTeam(true);
          router.push('/team/dashboard');
        } else {
          setHasTeam(false);
        }
      } catch (error) {
        console.error('Error checking team:', error);
        setHasTeam(false);
      } finally {
        setCheckingTeam(false);
      }
    };

    if (user) {
      checkTeam();
    }
  }, [user, router]);

  if (loading || checkingTeam) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-red-500 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (hasTeam) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-red-500 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-12">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 animate-pulse"></div>
          <div className="relative bg-black border-l-4 border-red-500 rounded-lg p-6">
            <h1 className="text-3xl font-mono font-bold bg-gradient-to-r from-red-500 via-red-300 to-red-500 text-transparent bg-clip-text">
              &gt; Team_Operations
            </h1>
            <p className="text-sm text-red-400/70 font-mono mt-2">
              <span className="text-red-500">[</span> SELECT YOUR OPERATION <span className="text-red-500">]</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Team Card */}
          <div className="group relative cursor-pointer" onClick={() => router.push('/team/create')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-black rounded-lg p-6 transform transition-all duration-300 group-hover:scale-[1.02]">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                  CREATE TEAM
                </h2>
              </div>
              <p className="text-red-400/70 font-mono text-sm">
                Start your own team and become a team leader
              </p>
            </div>
          </div>

          {/* Join Team Card */}
          <div className="group relative cursor-pointer" onClick={() => router.push('/team/join')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-black rounded-lg p-6 transform transition-all duration-300 group-hover:scale-[1.02]">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                  JOIN TEAM
                </h2>
              </div>
              <p className="text-red-400/70 font-mono text-sm">
                Join an existing team using an invite code
              </p>
            </div>
          </div>

          {/* Manage Team Card */}
          <div className="group relative cursor-pointer" onClick={() => router.push('/team/manage')}>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 via-red-900 to-red-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative bg-black rounded-lg p-6 transform transition-all duration-300 group-hover:scale-[1.02]">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <h2 className="text-xl font-mono font-bold bg-gradient-to-r from-red-500 to-red-300 text-transparent bg-clip-text">
                  MANAGE TEAM
                </h2>
              </div>
              <p className="text-red-400/70 font-mono text-sm">
                Manage your existing team
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
