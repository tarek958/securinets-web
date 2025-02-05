import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const authResult = await verifyAuth(request);
    const { challengeId } = params;

    // Check admin authorization
    if (!authResult.user || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    
    // Get the current challenge
    const currentChallenge = await db.collection('challenges').findOne({
      _id: new ObjectId(challengeId)
    });

    if (!currentChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Update the challenge
    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(challengeId) },
      { $set: updates }
    );

    // If status is being updated to 'active', emit socket event
    if (updates.status === 'active' && currentChallenge.status !== 'active') {
      const io = request.socket.server.io;
      if (io) {
        const challengeNotification = {
          _id: currentChallenge._id,
          title: currentChallenge.title,
          category: currentChallenge.category,
          points: currentChallenge.points
        };
        io.emit('newChallenge', challengeNotification);
      }
    }

    // Clear cache
    await db.redis?.del('challenges_all_*');

    return NextResponse.json({
      success: true,
      message: 'Challenge updated successfully',
      challengeId
    });

  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}
