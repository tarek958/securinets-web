import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/User';
import Challenge from '@/models/Challenge';
import Team from '@/models/Team';

export async function POST(request) {
  try {
    const { resetType, userId } = await request.json();
    const userData = JSON.parse(request.headers.get('x-user-data') || '{}');

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    switch (resetType) {
      case 'all':
        // Reset everything except admin users
        await User.deleteMany({ role: { $ne: 'admin' } });
        await Challenge.deleteMany({});
        await Team.deleteMany({});
        await db.collection('solves').deleteMany({});
        await db.collection('sessions').deleteMany({});
        break;

      case 'challenges':
        // Reset only challenges
        await Challenge.deleteMany({});
        await db.collection('solves').deleteMany({});
        break;

      case 'users':
        // Reset non-admin users
        await User.deleteMany({ role: { $ne: 'admin' } });
        await db.collection('solves').deleteMany({});
        await db.collection('sessions').deleteMany({});
        break;

      case 'teams':
        // Reset teams
        await Team.deleteMany({});
        await db.collection('solves').deleteMany({});
        break;

      case 'points':
        // Reset all solves which resets team points
        await db.collection('solves').deleteMany({});
        // Reset points for ALL users (including admins)
        await User.updateMany(
          {}, // No role filter - affects all users
          { 
            $set: { 
              ctfPoints: 0,
              solvedChallenges: []
            } 
          }
        );
        break;

      case 'all_sessions':
        // Reset all user sessions
        await db.collection('sessions').deleteMany({});
        break;

      case 'user_session':
        // Reset sessions for a specific user
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID is required for resetting user session' },
            { status: 400 }
          );
        }
        await db.collection('sessions').deleteMany({
          'session.user.id': userId
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid reset type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully reset ${resetType}${userId ? ` for user ${userId}` : ''}`
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
