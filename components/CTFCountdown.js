'use client';

import { useState, useEffect } from 'react';

export default function CTFCountdown({ settings }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!settings) {
      setStatus('not-configured');
      return;
    }

    let timer;

    const getTimeComponents = (difference) => ({
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000)
    });

    const calculateTimeLeft = () => {
      const start = new Date(settings.startTime).getTime();
      const end = new Date(settings.endTime).getTime();
      const now = new Date().getTime();

      if (now < start) {
        const difference = start - now;
        setStatus('not-started');
        return getTimeComponents(difference);
      } else if (now > end) {
        setStatus('ended');
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      } else {
        const difference = end - now;
        setStatus('running');
        return getTimeComponents(difference);
      }
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Set up interval
    timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [settings]);

  if (!settings) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
        <div className="text-gray-400 text-xl">CTF timing not configured</div>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'not-started':
        return 'bg-yellow-900/20 border-yellow-700';
      case 'running':
        return 'bg-green-900/20 border-green-700';
      case 'ended':
        return 'bg-red-900/20 border-red-700';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'not-started':
        return 'CTF starts in:';
      case 'running':
        return 'CTF ends in:';
      case 'ended':
        return 'CTF has ended';
      case 'not-configured':
        return 'CTF timing not configured';
      default:
        return 'Loading...';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'not-started':
        return 'text-yellow-500';
      case 'running':
        return 'text-green-500';
      case 'ended':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`p-8 rounded-lg border ${getStatusColor()}`}>
      <div className={`text-2xl font-bold mb-8 text-center ${getStatusTextColor()}`}>
        {getStatusMessage()}
      </div>
      {status !== 'ended' && status !== 'not-configured' && (
        <div className="grid grid-cols-4 gap-6">
          {[
            { value: timeLeft.days, label: 'Days' },
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Seconds' }
          ].map((item, index) => (
            <div key={item.label} className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {String(item.value).padStart(2, '0')}
              </div>
              <div className="text-gray-400 text-sm md:text-base">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
