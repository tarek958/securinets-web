'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function NotificationListener() {
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'challenge-notification') {
        toast.success(data.message, {
          duration: 5000,
          position: 'top-right',
          icon: '🎯',
        });
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return null;
}
