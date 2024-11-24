'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const NavbarCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [glitch, setGlitch] = useState(false);

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

        // Random glitch effect
        if (Math.random() > 0.95) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 150);
        }
      }, 1000);

      return () => clearInterval(interval);
    };

    updateCountdown();
  }, []);

  if (!timeLeft) return null;

  return (
    <Link href="/countdown">
      <motion.div
        className="hidden lg:flex items-center space-x-3 px-4 py-1.5 bg-red-500/10 rounded-lg border border-red-500/30 hover:bg-red-500/20 transition-colors cursor-pointer group"
        whileHover={{ scale: 1.05 }}
        animate={glitch ? {
          x: [-2, 2, -2, 2, 0],
          y: [2, -2, 2, -2, 0],
        } : {}}
        transition={{ duration: 0.2 }}
      >
        <span className="text-sm font-mono text-red-500">CTF STARTS IN:</span>
        <div className="flex items-center space-x-2 text-sm font-mono">
          {[
            { value: timeLeft.days, label: 'D' },
            { value: timeLeft.hours, label: 'H' },
            { value: timeLeft.minutes, label: 'M' },
            { value: timeLeft.seconds, label: 'S' }
          ].map((item, index) => (
            <div key={item.label} className="flex items-center">
              {index > 0 && <span className="text-gray-500 mr-2">:</span>}
              <span className="text-red-500 group-hover:text-red-400 transition-colors">
                {String(item.value).padStart(2, '0')}
                <span className="text-xs ml-0.5">{item.label}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </Link>
  );
};

export default NavbarCountdown;
