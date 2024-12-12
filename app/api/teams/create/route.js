import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

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
    const { name, description, isPublic = false } = await request.json();

    if (!name) {
      return NextResponse.json({
        success: false,
        message: 'Team name is required'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Get user details for leader info
    const userDetails = await db.collection('users').findOne(
      { _id: new ObjectId(user.id) },
      { projection: { password: 0 } }
    );

    if (!userDetails) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if user is already in a team
    const existingTeam = await db.collection('teams').findOne({
      $or: [
        { 'leader.id': user.id },
        { members: user.id },
        { pendingMembers: user.id }
      ]
    });

    if (existingTeam) {
      return NextResponse.json({
        success: false,
        message: 'You are already in a team'
      }, { status: 400 });
    }

    // Check if team name is taken
    const teamExists = await db.collection('teams').findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') }
    });

    if (teamExists) {
      return NextResponse.json({
        success: false,
        message: 'Team name is already taken'
      }, { status: 400 });
    }

    // Generate invite code for private teams
    const inviteCode = isPublic ? null : crypto.randomBytes(4).toString('hex');

    // Create team with 4-member limit
    const team = {
      name,
      description: description || '',
      leader: {
        id: user.id,
        username: userDetails.username,
        email: userDetails.email
      },
      members: [user.id], // Leader counts as first member
      pendingMembers: [],
      score: 0,
      solvedChallenges: [],
      isPublic,
      inviteCode,
      maxMembers: 4, // Enforce 4-member limit
      createdAt: new Date()
    };

    const result = await db.collection('teams').insertOne(team);

    // Update user's team information
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      { 
        $set: { 
          teamId: result.insertedId,
          teamRole: 'leader'
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      teamId: result.insertedId,
      inviteCode,
      remainingSlots: 3 // 4 max - 1 leader = 3 remaining slots
    });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
