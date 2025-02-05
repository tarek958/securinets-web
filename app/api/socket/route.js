import { Server as SocketServer } from 'socket.io';
import { NextResponse } from 'next/server';

const io = new SocketServer({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: '/api/socket'
});

export async function GET(req) {
  if (req.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    req.socket.server.io = io
  }
  
  const socketServer = req.socket.server.io
  
  socketServer.on('connection', socket => {
    console.log('Client connected:', socket.id)
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })

    // Handle challenge notifications
    socket.on('newChallenge', (challenge) => {
      console.log('New challenge notification:', challenge)
      socketServer.emit('newChallenge', challenge)
    })
  })

  return new NextResponse('Socket initialized', { status: 200 })
}

export const config = {
  api: {
    bodyParser: false
  }
}

// Export the io instance
export { io };
