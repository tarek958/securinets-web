'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const MinimalistCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const fetchCountdown = async () => {
      try {
        const response = await fetch('/api/admin/countdown');
        const data = await response.json();
        if (data.countdown) {
          return new Date(data.countdown.targetDate).getTime();
        }
        return null;
      } catch (error) {
        console.error('Error fetching countdown:', error);
        return null;
      }
    };

    const updateCountdown = async () => {
      const targetDate = await fetchCountdown();
      if (!targetDate) return;

      const interval = setInterval(() => {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
          clearInterval(interval);
          setTimeLeft(null);
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }, 1000);

      return () => clearInterval(interval);
    };

    updateCountdown();
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-4 gap-4">
        {[
          { value: timeLeft.days, label: 'DAYS' },
          { value: timeLeft.hours, label: 'HOURS' },
          { value: timeLeft.minutes, label: 'MINUTES' },
          { value: timeLeft.seconds, label: 'SECONDS' }
        ].map((item) => (
          <motion.div
            key={item.label}
            className="flex flex-col items-center justify-center p-4 bg-black/30 backdrop-blur-sm border border-red-500/20 rounded-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-4xl md:text-5xl lg:text-6xl font-mono text-red-500 font-bold">
              {String(item.value).padStart(2, '0')}
            </span>
            <span className="text-xs md:text-sm font-mono text-gray-400 mt-2">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="text-center mt-6">
        <motion.a
          href="/countdown"
          className="inline-block px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors font-mono text-sm"
          whileHover={{ scale: 1.05 }}
        >
          VIEW FULL COUNTDOWN
        </motion.a>
      </div>
    </div>
  );
};

export default MinimalistCountdown;
