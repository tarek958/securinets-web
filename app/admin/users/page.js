'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import { TrashIcon, UserPlusIcon, PencilIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function ManageUsers() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAdmin = async (userId, currentRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: currentRole === 'admin' ? 'user' : 'admin' }),
      });

      if (!response.ok) throw new Error('Failed to update user role');
      
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, role: currentRole === 'admin' ? 'user' : 'admin' } 
          : user
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewIpHistory = (user) => {
    setSelectedUser(selectedUser?._id === user._id ? null : user);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-red-500">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-red-500 font-mono">&gt; User_Management_Console</h1>
            <button
              onClick={() => router.push('/admin/users/add')}
              className="px-4 py-2 text-sm bg-red-500 text-black rounded-lg border border-red-500 hover:bg-red-600 transition-colors duration-300 font-mono inline-flex items-center"
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              [Add_User]
            </button>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-sm bg-red-900/30 text-red-500 rounded-lg border border-red-500 hover:bg-red-500 hover:text-black transition-colors duration-300 font-mono"
          >
            [Return_to_Dashboard]
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded mb-6 font-mono">
            [ERROR]: {error}
          </div>
        )}

        <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-red-500">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-500/30">
              <thead className="bg-red-900/30">
                <tr className="font-mono">
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    &gt; Username_
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    &gt; Email_
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    &gt; Latest_IP_
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    &gt; Access_Level_
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                    &gt; Join_Date_
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-red-500 uppercase tracking-wider">
                    &gt; Actions_
                  </th>
                </tr>
              </thead>
              <tbody className="bg-black divide-y divide-red-500/30 font-mono">
                {users.map((user) => (
                  <React.Fragment key={user._id}>
                    <tr className="hover:bg-red-900/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-500">
                          {user.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-500/80">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-red-500/80 mr-2">{user.latestIp}</span>
                          {user.ipHistory?.length > 0 && (
                            <button
                              onClick={() => handleViewIpHistory(user)}
                              className="text-red-500 hover:text-red-400"
                              title="View IP History"
                            >
                              <InformationCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-red-900/50 text-red-500 border border-red-500'
                            : 'bg-red-500/10 text-red-500 border border-red-500/50'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500/80">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => router.push(`/admin/users/edit/${user._id}`)}
                          className="text-red-500 hover:text-red-400 inline-flex items-center"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          [Edit]
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(user._id, user.role)}
                          className="text-red-500 hover:text-red-400"
                        >
                          [{user.role === 'admin' ? 'Revoke_Admin' : 'Grant_Admin'}]
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-500 hover:text-red-400 inline-flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          [Delete]
                        </button>
                      </td>
                    </tr>
                    {selectedUser?._id === user._id && (
                      <tr className="bg-red-900/10">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="text-sm text-red-500">
                            <h4 className="font-bold mb-2">&gt; IP_History_</h4>
                            <div className="grid grid-cols-2 gap-4">
                              {user.ipHistory.map((entry, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <span className="text-red-500/80">{entry.ip}</span>
                                  <span className="text-red-500/60">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
