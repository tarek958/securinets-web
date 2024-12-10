import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to view stats' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: session.user.email })
      .populate('solvedCTFs')
      .exec();

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate user rank based on points
    let rank = 'Beginner';
    if (user.ctfPoints >= 1000) {
      rank = 'Expert';
    } else if (user.ctfPoints >= 500) {
      rank = 'Advanced';
    } else if (user.ctfPoints >= 100) {
      rank = 'Intermediate';
    }

    // Get forum post count
    const forumPosts = user.forumPosts?.length || 0;

    const stats = {
      solvedCTFs: user.solvedCTFs.length,
      totalPoints: user.ctfPoints,
      forumPosts,
      rank,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { message: 'Error fetching user stats' },
      { status: 500 }
    );
  }
}
