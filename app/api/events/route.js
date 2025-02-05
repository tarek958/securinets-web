import { getIO } from '@/lib/socket';

export function broadcast(event, data) {
  const io = getIO();
  io.emit(event, data);
}

export async function GET() {
  return new Response('SSE endpoint', { status: 200 });
}