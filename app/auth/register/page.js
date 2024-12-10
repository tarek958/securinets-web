'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Automatically log in after successful registration
      await login(formData.email, formData.password);
      router.push('/profile');
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message,
      }));
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
            NEW USER SETUP
          </h2>
          <p className="mt-2 text-sm text-red-600 font-mono">
            {"<"} INITIALIZE REGISTRATION PROTOCOL {"/>"}
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-black/50 backdrop-blur-sm p-8 border border-red-500/30 rounded-lg shadow-lg" onSubmit={handleSubmit}>
          <div className="terminal-window">
            {Object.keys(errors).length > 0 && (
              <div className="text-red-500 font-mono text-sm mb-4 p-3 border border-red-500/30 rounded">
                {Object.values(errors).map((error, index) => (
                  <div key={index}>[ERROR] {error}</div>
                ))}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="sr-only">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-red-600 font-mono">{'>'}_</span>
                  <input
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2 bg-black border border-red-500/30 text-red-500 placeholder-red-700 font-mono rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="ENTER_USERNAME"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
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
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="sr-only">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-red-600 font-mono">{'>'}_</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2 bg-black border border-red-500/30 text-red-500 placeholder-red-700 font-mono rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="CONFIRM_PASSWORD"
                    value={formData.confirmPassword}
                    onChange={handleChange}
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
                {loading ? 'INITIALIZING...' : 'INITIALIZE SYSTEM ACCESS >'}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-red-600 font-mono">
          {"<"} EXISTING_USER {"/>"}{' '}
          <Link href="/auth/login" className="text-red-400 hover:text-red-300 underline-offset-4">
            ACCESS_SYSTEM
          </Link>
        </p>
      </div>
    </div>
  );
}
