import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Handle join requests (accept/reject)
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
    const { teamId, userId, action } = await request.json();

    if (!teamId || !userId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid action'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verify the user is a team member
    const team = await db.collection('teams').findOne({
      _id: new ObjectId(teamId),
      $or: [
        { leaderId: user.id },
        { members: user.id }
      ]
    });

    if (!team) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: Only team members can handle requests'
      }, { status: 403 });
    }

    // Check if the user is actually in pending members
    if (!team.pendingMembers?.includes(userId)) {
      return NextResponse.json({
        success: false,
        message: 'User is not in pending members'
      }, { status: 400 });
    }

    // Check team size limit before accepting
    if (action === 'accept' && team.members?.length >= 4) {
      return NextResponse.json({
        success: false,
        message: 'Team has reached the maximum limit of 4 members'
      }, { status: 400 });
    }

    if (action === 'accept') {
      // Move user from pending to members
      await db.collection('teams').updateOne(
        { _id: new ObjectId(teamId) },
        {
          $pull: { pendingMembers: userId },
          $addToSet: { members: userId }
        }
      );

      // Update user's team information
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            teamId: new ObjectId(teamId),
            teamRole: 'member'
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'User accepted to team'
      });
    } else {
      // Remove user from pending members
      await db.collection('teams').updateOne(
        { _id: new ObjectId(teamId) },
        { $pull: { pendingMembers: userId } }
      );

      return NextResponse.json({
        success: true,
        message: 'User rejected from team'
      });
    }

  } catch (error) {
    console.error('Error handling team request:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// Get pending requests for a team
export async function GET(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json({
        success: false,
        message: 'Team ID is required'
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Verify the user is a team member
    const team = await db.collection('teams').findOne({
      _id: new ObjectId(teamId),
      $or: [
        { leaderId: user.id },
        { members: user.id }
      ]
    });

    if (!team) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: Only team members can view requests'
      }, { status: 403 });
    }

    // Get pending members with their details
    const pendingMembers = team.pendingMembers ? await db.collection('users')
      .find({ _id: { $in: team.pendingMembers.map(id => new ObjectId(id)) } })
      .project({ 
        _id: 1,
        username: 1,
        email: 1,
        solvedChallenges: 1,
        ctfPoints: 1
      })
      .toArray() : [];

    return NextResponse.json({
      success: true,
      pendingMembers
    });

  } catch (error) {
    console.error('Error fetching team requests:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
