'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HackingCountdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [scramble, setScramble] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      // Create scrambled effect
      if (Math.random() > 0.7) {
        setScramble({
          days: Math.floor(Math.random() * 99).toString().padStart(2, '0'),
          hours: Math.floor(Math.random() * 24).toString().padStart(2, '0'),
          minutes: Math.floor(Math.random() * 60).toString().padStart(2, '0'),
          seconds: Math.floor(Math.random() * 60).toString().padStart(2, '0')
        });
      }

      // Random glitch effect
      if (Math.random() > 0.95) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatNumber = (num) => num.toString().padStart(2, '0');

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <motion.div
        className={`relative bg-black/50 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-red-500/20 ${glitch ? 'glitch' : ''}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-900/10 rounded-xl" />
        
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-8 text-red-500 relative z-10"
          animate={{ textShadow: glitch ? '2px 2px #ff0000, -2px -2px #00ff00' : '0 0 10px rgba(255,0,0,0.5)' }}
        >
          CTF COUNTDOWN
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center relative z-10">
          {[
            { label: 'DAYS', value: timeLeft.days, scrambled: scramble.days },
            { label: 'HOURS', value: timeLeft.hours, scrambled: scramble.hours },
            { label: 'MINUTES', value: timeLeft.minutes, scrambled: scramble.minutes },
            { label: 'SECONDS', value: timeLeft.seconds, scrambled: scramble.seconds }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              className="bg-black/80 rounded-lg p-4 border border-red-500/30 relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent" />
              <div className="absolute inset-0 bg-grid-pattern opacity-20" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={formatNumber(item.value)}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-4xl md:text-6xl font-mono font-bold text-red-500 mb-2 relative"
                  style={{
                    textShadow: glitch 
                      ? '2px 2px #ff0000, -2px -2px #00ff00' 
                      : '0 0 10px rgba(255,0,0,0.5)'
                  }}
                >
                  {Math.random() > 0.8 ? item.scrambled : formatNumber(item.value)}
                </motion.div>
              </AnimatePresence>

              <div className="text-sm md:text-base font-bold text-gray-400 relative">
                {item.label}
              </div>

              <div className="absolute inset-0 border-2 border-red-500/0 group-hover:border-red-500/50 transition-colors duration-300 rounded-lg" />
            </motion.div>
          ))}
        </div>

        <style jsx global>{`
          @keyframes glitch {
            0% {
              transform: translate(0);
            }
            20% {
              transform: translate(-2px, 2px);
            }
            40% {
              transform: translate(-2px, -2px);
            }
            60% {
              transform: translate(2px, 2px);
            }
            80% {
              transform: translate(2px, -2px);
            }
            100% {
              transform: translate(0);
            }
          }

          .glitch {
            animation: glitch 0.3s infinite;
          }

          .bg-grid-pattern {
            background-image: linear-gradient(rgba(255, 0, 0, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 0, 0, 0.1) 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}</style>
      </motion.div>
    </div>
  );
};

export default HackingCountdown;
