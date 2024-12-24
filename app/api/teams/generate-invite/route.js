import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const { teamId } = await request.json();
    const { db } = await connectToDatabase();

    // Verify user is team leader
    const team = await db.collection('teams').findOne({
      _id: new ObjectId(teamId),
      leaderId: user.id
    });

    if (!team) {
      return NextResponse.json(
        { success: false, message: 'You are not authorized to generate invites for this team' },
        { status: 403 }
      );
    }

    // Check team size
    if (team.members.length >= 4) {
      return NextResponse.json({ success: false, message: 'Team has reached maximum size of 4 members' }, { status: 400 });
    }

    // Generate new invite code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from(
        { length: 8 },
        () => chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');
    };

    let isUnique = false;
    let inviteCode;
    while (!isUnique) {
      inviteCode = generateCode();
      const existingTeam = await db.collection('teams').findOne({ inviteCode });
      if (!existingTeam || existingTeam._id.equals(team._id)) {
        isUnique = true;
      }
    }

    // Update team with new invite code
    await db.collection('teams').updateOne(
      { _id: new ObjectId(teamId) },
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
    return NextResponse.json(
      { success: false, message: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
