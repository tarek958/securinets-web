import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Challenge from '@/models/Challenge';
import Post from '@/models/Post';

export const dynamic = 'force-dynamic'; // Ensure this route is treated dynamically

export async function GET(request) {
  try {
    // Parse user data from headers
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

    // Connect to the database
    await connectDB();

    // Fetch counts from the database
    const [totalUsers, totalPosts, totalChallenges, totalWriteups, activeChallenges] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Challenge.countDocuments(),
      Challenge.countDocuments({ writeup: { $exists: true, $ne: null } }),
      Challenge.countDocuments({ active: true }),
    ]);

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalChallenges,
        activeChallenges,
        totalWriteups,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stats',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
