'use client';

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const ChallengeNotification = () => {
  useEffect(() => {
    console.log('=== Client Socket Debug Log ===');
    console.log('1. Initializing socket connection');
    
    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/api/socket',
      addTrailingSlash: false,
      transports: ['websocket'],
      autoConnect: true,
    });

    // Connection successful
    socket.on('connect', () => {
      console.log('2. Socket Connected:', {
        socketId: socket.id,
        transport: socket.io.engine.transport.name,
        state: socket.connected ? 'connected' : 'disconnected'
      });
    });

    // Handle new challenge notifications
    socket.on('newChallenge', (challenge) => {
      console.log('3. New Challenge Notification Received:', {
        challengeId: challenge._id,
        title: challenge.title,
        category: challenge.category,
        points: challenge.points,
        timestamp: new Date().toISOString()
      });

      toast.success(`New challenge available: ${challenge.title} (${challenge.category} - ${challenge.points} pts)`, {
        duration: 5000,
        position: 'top-right',
      });
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('4. Socket Connection Error:', {
        message: error.message,
        type: error.type,
        description: error.description,
        timestamp: new Date().toISOString()
      });
      
      
    });

    // Handle general socket errors
    socket.on('error', (error) => {
      console.error('5. Socket Error:', {
        error,
        socketId: socket.id,
        state: socket.connected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    });

    // Cleanup on unmount
    return () => {
      console.log('6. Cleaning up socket connection:', {
        socketId: socket.id,
        state: socket.connected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
      socket.disconnect();
      console.log('=== End Client Socket Debug Log ===');
    };
  }, []);

  return null;
};

export default ChallengeNotification;
