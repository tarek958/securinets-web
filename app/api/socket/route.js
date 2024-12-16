import { Server as SocketServer } from 'socket.io';
import { NextResponse } from 'next/server';

let io;

if (!global.io) {
  io = new SocketServer({
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket'
  });
  global.io = io;
} else {
  io = global.io;
}

export async function GET(req) {
  if (!io) {
    return NextResponse.json(
      { error: 'Socket server not initialized' },
      { status: 500 }
    );
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Export the io instance
export { io };
