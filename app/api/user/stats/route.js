import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const { db } = await connectToDatabase();

    // Get user stats
    const stats = await db.collection('users').findOne(
      { _id: user.id },
      { projection: { solvedCTFs: 1, points: 1, forumPosts: 1, rank: 1 } }
    );

    return NextResponse.json({
      success: true,
      stats: {
        solvedCTFs: stats?.solvedCTFs || 0,
        totalPoints: stats?.points || 0,
        forumPosts: stats?.forumPosts || 0,
        rank: stats?.rank || 'Beginner'
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}
