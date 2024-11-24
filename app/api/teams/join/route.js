import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const { teamId, inviteCode } = await request.json();

    if (!teamId) {
      return NextResponse.json({ success: false, message: 'Team ID is required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check if user is already in a team
    const userTeam = await db.collection('teams').findOne({
      $or: [
        { leaderId: user.id },
        { members: user.id },
        { pendingMembers: user.id }
      ]
    });

    if (userTeam) {
      return NextResponse.json({
        success: false,
        message: 'You are already in a team or have a pending request'
      }, { status: 400 });
    }

    // Find the team
    const team = await db.collection('teams').findOne({
      _id: new ObjectId(teamId)
    });

    if (!team) {
      return NextResponse.json({
        success: false,
        message: 'Team not found'
      }, { status: 404 });
    }

    // For private teams, validate invite code
    if (!team.isPublic) {
      if (!inviteCode || inviteCode !== team.inviteCode) {
        return NextResponse.json({
          success: false,
          message: 'Invalid invite code'
        }, { status: 403 });
      }
    }

    // For public teams, add to pending members
    // For private teams with correct invite code, add directly to members
    const updateField = team.isPublic ? 'pendingMembers' : 'members';
    
    await db.collection('teams').updateOne(
      { _id: new ObjectId(teamId) },
      { $addToSet: { [updateField]: user.id } }
    );

    // If joining with invite code, update user's team information
    if (!team.isPublic && inviteCode) {
      await db.collection('users').updateOne(
        { _id: new ObjectId(user.id) },
        { 
          $set: { 
            teamId: new ObjectId(teamId),
            teamRole: 'member'
          } 
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: team.isPublic 
        ? 'Join request sent successfully' 
        : 'Joined team successfully',
      status: team.isPublic ? 'pending' : 'joined'
    });

  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
