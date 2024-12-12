'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';

export default function AddUser() {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    ip: '',
    role: 'user'
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!user || user.role !== 'admin') {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }
      
      router.push('/admin/users');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-8 text-red-500">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-500 font-mono">&gt; Create_New_User</h1>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 text-sm bg-red-900/30 text-red-500 rounded-lg border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono"
          >
            [Return_to_Users]
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded mb-6 font-mono">
            [ERROR]: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gray-900 shadow-lg rounded-lg p-6 border border-red-500">
          <div className="space-y-6">
            <div className="group">
              <label htmlFor="username" className="block text-sm font-medium text-red-500 font-mono mb-1">
                &gt; Username_
              </label>
              <input
                type="text"
                id="username"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                className="mt-1 block w-full rounded-md bg-black border-red-500 text-red-500 shadow-sm focus:border-red-400 focus:ring focus:ring-red-500/20 sm:text-sm font-mono placeholder-red-800"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-red-500 font-mono mb-1">
                &gt; Email_
              </label>
              <input
                type="email"
                id="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="mt-1 block w-full rounded-md bg-black border-red-500 text-red-500 shadow-sm focus:border-red-400 focus:ring focus:ring-red-500/20 sm:text-sm font-mono placeholder-red-800"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-red-500 font-mono mb-1">
                &gt; Password_
              </label>
              <input
                type="password"
                id="password"
                value={userData.password}
                onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                className="mt-1 block w-full rounded-md bg-black border-red-500 text-red-500 shadow-sm focus:border-red-400 focus:ring focus:ring-red-500/20 sm:text-sm font-mono placeholder-red-800"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="ip" className="block text-sm font-medium text-red-500 font-mono mb-1">
                &gt; IP_Address_
              </label>
              <input
                type="text"
                id="ip"
                value={userData.ip}
                onChange={(e) => setUserData({ ...userData, ip: e.target.value })}
                className="mt-1 block w-full rounded-md bg-black border-red-500 text-red-500 shadow-sm focus:border-red-400 focus:ring focus:ring-red-500/20 sm:text-sm font-mono placeholder-red-800"
                pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                placeholder="xxx.xxx.xxx.xxx"
              />
            </div>

            <div className="group">
              <label htmlFor="role" className="block text-sm font-medium text-red-500 font-mono mb-1">
                &gt; Access_Level_
              </label>
              <select
                id="role"
                value={userData.role}
                onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                className="mt-1 block w-full rounded-md bg-black border-red-500 text-red-500 shadow-sm focus:border-red-400 focus:ring focus:ring-red-500/20 sm:text-sm font-mono"
              >
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-red-500/30">
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 text-sm font-medium text-red-500 bg-black border border-red-500 rounded-md shadow-sm hover:bg-red-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300 font-mono"
              >
                [Cancel]
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-black bg-red-500 border border-red-500 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors duration-300 font-mono"
              >
                {saving ? '[Processing...]' : '[Create_User]'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
