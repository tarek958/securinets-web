import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Challenge from '@/models/Challenge';
import Post from '@/models/Post';

export async function GET(request) {
  try {
    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    // Get counts from each collection
    const [totalUsers, totalPosts, totalChallenges, totalWriteups] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Challenge.countDocuments(),
      Challenge.countDocuments({ writeup: { $exists: true, $ne: null } })
    ]);

    // Get count of active challenges
    const activeChallenges = await Challenge.countDocuments({ 
      active: true 
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalChallenges,
        activeChallenges,
        totalWriteups
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stats',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
