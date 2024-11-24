'use client';
import { useState, useEffect } from 'react';
import HackingCountdown from '@/components/HackingCountdown';
import MatrixBackground from '@/components/MatrixBackground';
import { useAuth } from '@/components/Providers';

export default function CountdownClient() {
  const [targetDate, setTargetDate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newDate, setNewDate] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchCountdown();
  }, []);

  const fetchCountdown = async () => {
    try {
      const response = await fetch('/api/admin/countdown');
      const data = await response.json();
      if (data.countdown) {
        setTargetDate(data.countdown.targetDate);
        setNewDate(new Date(data.countdown.targetDate).toISOString().slice(0, 16));
      }
    } catch (error) {
      console.error('Error fetching countdown:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/countdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetDate: newDate }),
      });
      const data = await response.json();
      if (data.countdown) {
        setTargetDate(data.countdown.targetDate);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error setting countdown:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <MatrixBackground />
      <div className="container mx-auto px-4 relative z-10">
        {user?.role === 'admin' && (
          <div className="mb-8 max-w-md mx-auto">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4 bg-black/50 backdrop-blur-md p-6 rounded-lg border border-red-500/30">
                <div>
                  <label htmlFor="targetDate" className="block text-sm font-medium text-gray-300 mb-2">
                    Target Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    id="targetDate"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-red-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2 bg-red-500/20 text-black font-bold border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors backdrop-blur-md"
              >
                Edit Countdown
              </button>
            )}
          </div>
        )}
        {targetDate ? (
          <HackingCountdown targetDate={targetDate} />
        ) : (
          <div className="text-center text-red-500 text-xl font-bold mt-20">No countdown set</div>
        )}
      </div>
    </div>
  );
}
