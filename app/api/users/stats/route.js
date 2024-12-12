import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const userId = user.sub || user._id || user.id;
    const { db } = await connectToDatabase();

    // Get user's solved challenges
    const userDoc = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { solvedChallenges: 1, ctfPoints: 1 } }
    );

    // Get user's rank
    const userRank = await db.collection('users')
      .countDocuments({
        ctfPoints: { $gt: userDoc.ctfPoints || 0 }
      });

    const stats = {
      solvedChallenges: userDoc.solvedChallenges?.length || 0,
      totalPoints: userDoc.ctfPoints || 0,
      rank: userRank + 1 // Add 1 since rank is 0-based
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
