import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('auth-token');
  return Response.json({ message: 'Logged out successfully' });
}
