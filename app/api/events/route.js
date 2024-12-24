import { NextResponse } from 'next/server';

// Store connected clients
const clients = new Set();

export async function GET() {
  const encoder = new TextEncoder();

  // Create a new readable stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Add this client's controller to the set
      clients.add(controller);

      // Handle client disconnect
      return () => {
        clients.delete(controller);
        controller.close();
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Function to broadcast events to all connected clients
export async function broadcast(event) {
  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify(event)}\n\n`;
  const encodedData = encoder.encode(data);

  // Send to all connected clients
  clients.forEach((controller) => {
    try {
      controller.enqueue(encodedData);
    } catch (error) {
      console.error('Error sending event to client:', error);
      clients.delete(controller);
      try {
        controller.close();
      } catch (e) {
        // Ignore close errors
      }
    }
  });

  // Log the broadcast
  console.log(`Event broadcast to ${clients.size} clients:`, event);
}
