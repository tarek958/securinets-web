'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/'); // Redirect to home page after successful login
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-red-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Matrix-like background animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="matrix-bg"></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 relative">
        <div className="text-center">
          <h2 className="text-4xl font-mono font-bold tracking-wider text-red-400 glitch-text">
            SYSTEM ACCESS
          </h2>
          <p className="mt-2 text-sm text-red-600 font-mono">
            {"<"} INITIALIZE AUTHENTICATION PROTOCOL {"/>"}
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-black/50 backdrop-blur-sm p-8 border border-red-500/30 rounded-lg shadow-lg" onSubmit={handleSubmit}>
          <div className="terminal-window">
            {error && (
              <div className="text-red-500 font-mono text-sm mb-4 p-3 border border-red-500/30 rounded">
                [ERROR] {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="sr-only">Email address</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-red-600 font-mono">{'>'}_</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2 bg-black border border-red-500/30 text-red-500 placeholder-red-700 font-mono rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="ENTER_EMAIL"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="sr-only">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-red-600 font-mono">{'>'}_</span>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2 bg-black border border-red-500/30 text-red-500 placeholder-red-700 font-mono rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="ENTER_PASSWORD"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 border border-red-500 text-red-500 font-mono rounded hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE >'}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-red-600 font-mono">
          {"<"} NEW_USER {"/>"}{' '}
          <Link href="/auth/register" className="text-red-400 hover:text-red-300 underline-offset-4">
            INITIALIZE_REGISTRATION
          </Link>
        </p>
      </div>
    </div>
  );
}
