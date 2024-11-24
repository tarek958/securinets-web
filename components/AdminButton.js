'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUserCog } from 'react-icons/fa';

export default function AdminButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.user.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Failed to verify admin status:', err);
      }
    };

    checkAdminStatus();
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
    >
      <FaUserCog className="text-lg" />
      <span>Admin</span>
    </Link>
  );
}
