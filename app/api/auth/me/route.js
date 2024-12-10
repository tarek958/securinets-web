import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');

    if (!token) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verify(token.value, process.env.JWT_SECRET || 'fallback_secret');
    
    // Get user data from database to include solved challenges
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.id)
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role || 'user',
        solvedChallenges: user.solvedChallenges || [],
        ctfPoints: user.ctfPoints || 0
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
