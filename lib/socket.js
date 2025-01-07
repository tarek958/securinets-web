import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  if (io) {
    console.log('Socket.IO already initialized');
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/api/socket'
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket.IO initialized');
  return io;
}

export function getIO() {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return null;
  }
  return io;
}

export function emitChallengeNotification(data) {
  if (!io) {
    console.warn('Socket.IO not initialized, cannot emit challenge notification');
    return;
  }
  console.log('Emitting challenge notification:', data);
  io.emit('challenge-notification', data);
}
