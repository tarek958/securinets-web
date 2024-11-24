import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Challenge from '@/models/Challenge';
import User from '@/models/User';
import { verifyAuth, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();

    // Get all challenges with writeups
    const challenges = await Challenge.find(
      { writeup: { $exists: true, $ne: null } },
      'title category difficulty points writeup'
    ).lean();

    // Get solved challenges for each user
    const users = await User.find({}, 'username solvedChallenges').lean();
    
    // Create a map of challenge solves
    const challengeSolves = {};
    users.forEach(user => {
      if (user.solvedChallenges && Array.isArray(user.solvedChallenges)) {
        user.solvedChallenges.forEach(solve => {
          if (solve && solve.challengeId) {
            const challengeId = solve.challengeId.toString();
            if (!challengeSolves[challengeId]) {
              challengeSolves[challengeId] = 0;
            }
            challengeSolves[challengeId]++;
          }
        });
      }
    });

    // Add solve count to each challenge
    const writeups = challenges.map(challenge => ({
      ...challenge,
      solveCount: challengeSolves[challenge._id.toString()] || 0
    }));

    return NextResponse.json({
      success: true,
      data: writeups
    });

  } catch (error) {
    console.error('Error fetching writeups:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch writeups',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify admin authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!isAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    await connectDB();

    const data = await request.json();
    const { challengeId, writeup } = data;

    if (!challengeId || !writeup) {
      return NextResponse.json(
        { success: false, error: 'Challenge ID and writeup are required' },
        { status: 400 }
      );
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    challenge.writeup = writeup;
    await challenge.save();

    return NextResponse.json({
      success: true,
      data: challenge
    });

  } catch (error) {
    console.error('Error saving writeup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save writeup',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
