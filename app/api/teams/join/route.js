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
        { 'leader.id': user.id },
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

    // Check team size limit (4 members including leader)
    const currentMemberCount = team.members ? team.members.length : 0;
    if (currentMemberCount >= 4) {
      return NextResponse.json({
        success: false,
        message: 'Team has reached the maximum limit of 4 members'
      }, { status: 400 });
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

    // If joining with invite code, update user's team information and handle solved challenges
    if (!team.isPublic && inviteCode) {
      // Get user's solved challenges
      const joiningUser = await db.collection('users').findOne(
        { _id: new ObjectId(user.id) },
        { projection: { solvedChallenges: 1 } }
      );

      // Get all team members' solved challenges
      const teamMembers = await db.collection('users')
        .find({ _id: { $in: team.members.map(id => new ObjectId(id)) } })
        .project({ solvedChallenges: 1 })
        .toArray();

      // Get all challenges solved by the joining user
      const userSolvedChallenges = joiningUser.solvedChallenges || [];
      
      // Get all challenges solved by team members
      const teamSolvedChallenges = new Set(
        teamMembers.flatMap(member => member.solvedChallenges || [])
          .map(id => id.toString())
      );

      // Find new challenges that only the joining user has solved
      const newSolves = userSolvedChallenges.filter(
        challengeId => !teamSolvedChallenges.has(challengeId.toString())
      );

      if (newSolves.length > 0) {
        // Get points for new challenges
        const newChallenges = await db.collection('challenges')
          .find({ _id: { $in: newSolves.map(id => new ObjectId(id)) } })
          .project({ points: 1 })
          .toArray();

        const additionalPoints = newChallenges.reduce((sum, challenge) => sum + (challenge.points || 0), 0);

        // Update team's total points and solved challenges
        await db.collection('teams').updateOne(
          { _id: new ObjectId(teamId) },
          { 
            $inc: { points: additionalPoints },
            $addToSet: { 
              solvedChallenges: { $each: newSolves.map(id => id.toString()) }
            }
          }
        );

        // Mark these challenges as solved by team for all members
        const io = getIO();
        if (io) {
          team.members.forEach(memberId => {
            io.to(memberId).emit('teamChallengesUpdate', {
              newSolves: newSolves,
              solvedByUserId: user.id
            });
          });
        }
      }

      // Update user's team information
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
      status: team.isPublic ? 'pending' : 'joined',
      remainingSlots: 4 - (currentMemberCount + 1)
    });

  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
