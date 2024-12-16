import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase as connectToDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { getIO } from '@/lib/socket';

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

    const { db } = await connectToDb();

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
      // Get joining user's solved challenges and points
      const joiningUser = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { solvedChallenges: 1, username: 1 } }
      );

      // Get user's points from solves
      const userSolves = await db.collection('solves')
        .find({ 
          $or: [
            { userId: userId },
            { userId: joiningUser._id.toString() }
          ]
        })
        .toArray();

      console.log('Found solves for joining user:', {
        userId,
        userIdFromDb: joiningUser._id.toString(),
        solvesCount: userSolves.length,
        solves: userSolves.map(s => ({ points: s.points, userId: s.userId }))
      });

      const userPoints = userSolves.reduce((sum, solve) => sum + (solve.points || 0), 0);

      console.log('Joining user points:', {
        userId,
        username: joiningUser.username,
        points: userPoints,
        solvedChallenges: joiningUser.solvedChallenges?.length
      });

      // Get all challenges solved by the joining user
      const userSolvedChallenges = joiningUser.solvedChallenges || [];
      
      // Get all challenges currently solved by the team
      const teamSolvedChallenges = new Set(
        (team.solvedChallenges || []).map(id => id.toString())
      );

      console.log('Team before update:', {
        teamId: team._id,
        teamPoints: team.points,
        solvedChallenges: team.solvedChallenges?.length
      });

      // Find new challenges that only the joining user has solved
      const newSolves = userSolvedChallenges.filter(
        challengeId => !teamSolvedChallenges.has(challengeId.toString())
      );

      let additionalPoints = 0;
      if (newSolves.length > 0) {
        // Get points for new challenges
        const newChallenges = await db.collection('challenges')
          .find({ _id: { $in: newSolves.map(id => new ObjectId(id)) } })
          .project({ points: 1 })
          .toArray();

        additionalPoints = newChallenges.reduce((sum, challenge) => sum + (challenge.points || 0), 0);

        console.log('New solves:', {
          count: newSolves.length,
          additionalPoints
        });

        // Update team's total points and solved challenges
        await db.collection('teams').updateOne(
          { _id: new ObjectId(teamId) },
          { 
            $inc: { points: additionalPoints },
            $addToSet: { 
              solvedChallenges: { $each: newSolves }
            }
          }
        );

        // Mark these challenges as solved by team for all members
        const io = getIO();
        if (io) {
          team.members.forEach(memberId => {
            io.to(memberId).emit('teamChallengesUpdate', {
              newSolves: newSolves,
              solvedByUserId: userId
            });
          });
        }
      }

      // Add user's existing points to team points
      console.log('Adding user points to team:', {
        userPoints,
        additionalPoints,
        currentTeamPoints: team.points,
        newTotal: (team.points || 0) + userPoints + additionalPoints
      });

      await db.collection('teams').updateOne(
        { _id: new ObjectId(teamId) },
        { $inc: { points: userPoints } }
      );

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

      // Get updated team data for verification
      const updatedTeam = await db.collection('teams').findOne({ _id: new ObjectId(teamId) });
      console.log('Updated team:', {
        teamId: updatedTeam._id,
        points: updatedTeam.points,
        solvedChallenges: updatedTeam.solvedChallenges?.length
      });

      return NextResponse.json({
        success: true,
        message: 'User accepted to team',
        newSolves: newSolves.length > 0 ? newSolves : undefined,
        additionalPoints: additionalPoints + userPoints,
        debug: {
          userPoints,
          additionalPoints,
          totalPoints: additionalPoints + userPoints
        }
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

    const { db } = await connectToDb();

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
