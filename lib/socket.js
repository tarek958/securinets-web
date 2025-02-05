import { Server } from 'socket.io';
import { challengeEvents } from './events.js';

let io;

export function initSocket(server) {
  if (!io) {
    console.log('Initializing Socket.IO server...');
    io = new Server(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    // Listen for challenge notifications
    challengeEvents.on('newChallenge', (challenge) => {
      console.log('Received challenge event, broadcasting to clients:', challenge);
      io.emit('newChallenge', challenge);
    });

    console.log('Socket.IO server initialized');
  }
  return io;
}

export function getIO() {
  if (!io) {
    console.error('Socket.IO not initialized - this should not happen');
    throw new Error('Socket.IO not initialized');
  }
  console.log('Getting IO instance. Connected clients:', io.engine.clientsCount);
  return io;
}

export function notifyNewChallenge(challenge) {
  console.log('=== Notification Debug Log ===');
  console.log('1. Starting notification process');
  console.log('Challenge data:', challenge);
  
  try {
    // Emit the event through the EventEmitter
    challengeEvents.emit('newChallenge', challenge);
    console.log('2. Event emitted through EventEmitter');
    
    // Log socket status
    if (io) {
      console.log('3. Socket.IO Server Status:');
      console.log('- Connected clients:', io.engine.clientsCount);
      console.log('- Connected socket IDs:', Array.from(io.sockets.sockets.keys()));
    } else {
      console.log('3. Socket.IO not initialized yet');
    }
    
    console.log('=== End Notification Debug Log ===');
  } catch (error) {
    console.error('!!! Notification Error !!!');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

export function updateLeaderboard(data) {
  const io = getIO();
  io.emit('leaderboardUpdate', data);
}
