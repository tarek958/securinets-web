import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.sub || session.user._id || session.user.id;
    const { db } = await connectToDatabase();

    // Find user's team where they are the leader
    const team = await db.collection('teams').findOne({
      leaderId: userId
    });

    if (!team) {
      return NextResponse.json({ 
        success: false,
        message: 'Team not found or user is not team leader' 
      }, { status: 403 });
    }

    // Check team size
    if (team.members.length >= 4) {
      return NextResponse.json({ success: false, message: 'Team has reached maximum size of 4 members' }, { status: 400 });
    }

    // Generate a random invite code
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Update the team with the new invite code
    await db.collection('teams').updateOne(
      { _id: team._id },
      { 
        $set: { 
          inviteCode,
          isPublic: false
        } 
      }
    );

    return NextResponse.json({ 
      success: true,
      inviteCode
    });

  } catch (error) {
    console.error('Error generating invite code:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
