import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getIO, updateLeaderboard } from '@/lib/socket.js';

export async function POST(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { flag } = await request.json();
    const { challengeId } = params;

    // Verify user is authenticated
    const userCheck = await db.collection('users').findOne({ 
      _id: new ObjectId(request.headers.get('user-id'))
    });

    if (!userCheck) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Get challenge details
    const challenge = await db.collection('challenges').findOne({
      _id: new ObjectId(challengeId)
    });

    if (!challenge) {
      return NextResponse.json({ success: false, message: 'Challenge not found' }, { status: 404 });
    }

    // Check if user has already solved this challenge
    const alreadySolved = userCheck.solvedChallenges && 
      userCheck.solvedChallenges.some(id => id.toString() === challengeId.toString());
    
    if (alreadySolved) {
      return NextResponse.json({ 
        success: false, 
        message: 'You have already solved this challenge' 
      }, { status: 400 });
    }

    // Verify flag
    if (flag !== challenge.flag) {
      return NextResponse.json({ 
        success: false, 
        message: 'Incorrect flag' 
      }, { status: 400 });
    }

    // Calculate current points
    const currentPoints = userCheck.ctfPoints || 0;

    // Update user's solved challenges and points atomically
    const result = await db.collection('users').updateOne(
      { _id: userCheck._id },
      { 
        $addToSet: { 
          solvedChallenges: new ObjectId(challengeId)
        },
        $set: { 
          ctfPoints: currentPoints + challenge.points,
          updatedAt: new Date()
        }
      }
    );

    if (!result.modifiedCount) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update user progress' 
      }, { status: 500 });
    }

    // Get updated user data
    const updatedUser = await db.collection('users').findOne({
      _id: userCheck._id
    });

    console.log('Points update result:', {
      challengePoints: challenge.points,
      oldPoints: currentPoints,
      newPoints: updatedUser.ctfPoints,
      userId: userCheck._id.toString()
    });

    // Update leaderboard for all connected users
    try {
      const io = getIO();
      if (io) {
        // Emit flag submission event
        io.emit('flag-submitted', {
          userId: userCheck._id.toString(),
          challengeId: challengeId,
          points: challenge.points
        });

        // Update leaderboard
        await updateLeaderboard();
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Congratulations! Flag is correct',
      points: challenge.points,
      totalPoints: updatedUser.ctfPoints
    });

  } catch (error) {
    console.error('Error in flag submission:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
