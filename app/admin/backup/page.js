'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/Providers';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function BackupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchBackups();
  }, [user, router]);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        headers: {
          'x-user-data': JSON.stringify(user)
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch backups');
      }

      const data = await response.json();
      if (data.success) {
        setBackups(data.backups);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const createBackup = async () => {
    if (!confirm('Are you sure you want to create a new backup?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'x-user-data': JSON.stringify(user)
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      const data = await response.json();
      if (data.success) {
        alert('Backup created successfully');
        fetchBackups();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupPath) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite the current database.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': JSON.stringify(user)
        },
        body: JSON.stringify({ backupPath })
      });

      if (!response.ok) {
        throw new Error('Failed to restore backup');
      }

      const data = await response.json();
      if (data.success) {
        alert('Database restored successfully');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatSize = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="min-h-screen bg-black text-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <ArrowDownTrayIcon className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold font-mono">&gt; Database_Backup</h1>
          </div>
          <button
            onClick={createBackup}
            disabled={loading}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500 rounded font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Create_New_Backup'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 font-mono">
            [ERROR]: {error}
          </div>
        )}

        <div className="space-y-4">
          {backups.map((backup) => (
            <div
              key={backup.name}
              className="p-4 border border-red-500 rounded-lg bg-black flex items-center justify-between"
            >
              <div>
                <h3 className="font-mono text-lg">{backup.name}</h3>
                <p className="text-sm text-gray-400">Created: {formatDate(backup.created)}</p>
                <p className="text-sm text-gray-400">Size: {formatSize(backup.size)}</p>
              </div>
              <button
                onClick={() => restoreBackup(backup.path)}
                disabled={loading}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500 rounded font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Restore_Backup'}
              </button>
            </div>
          ))}

          {backups.length === 0 && (
            <div className="text-center py-8 text-gray-400 font-mono">
              No backups available. Create your first backup to protect your data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
