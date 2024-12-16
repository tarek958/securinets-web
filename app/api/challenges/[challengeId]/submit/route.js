import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getIO, updateLeaderboard } from '@/lib/socket.js';

export async function POST(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { flag } = await request.json();
    const challengeId = await params.challengeId;

    // Check if CTF has ended
    const countdown = await db.collection('countdown').findOne({});
    if (countdown) {
      const targetDate = new Date(countdown.targetDate);
      const now = new Date();
      if (now >= targetDate) {
        return NextResponse.json({ 
          success: false, 
          message: 'The CTF has ended. Flag submissions are no longer accepted.' 
        }, { status: 403 });
      }
    }

    console.log('Debug - Challenge submission:', {
      challengeId,
      flag,
      userId: request.headers.get('user-id')
    });

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

    console.log('Debug - Found challenge:', challenge);

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

    // Get user's team
    const team = await db.collection('teams').findOne({
      $or: [
        { leaderId: userCheck._id.toString() },
        { members: userCheck._id.toString() }
      ]
    });

    if (team) {
      // Check if any team member has already solved this challenge
      const teamMembers = [...team.members, team.leaderId].map(id => 
        typeof id === 'string' ? id : id.toString()
      );

      const teamSolves = await db.collection('users').findOne({
        _id: { $in: teamMembers.map(id => new ObjectId(id)) },
        solvedChallenges: new ObjectId(challengeId)
      });

      if (teamSolves) {
        return NextResponse.json({ 
          success: false, 
          message: 'This challenge has already been solved by your team' 
        }, { status: 400 });
      }
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
    const newPoints = currentPoints + challenge.points;

    // Update user's solved challenges and points
    await db.collection('users').updateOne(
      { _id: userCheck._id },
      { 
        $addToSet: { 
          solvedChallenges: new ObjectId(challengeId)
        },
        $set: { 
          ctfPoints: newPoints,
          updatedAt: new Date()
        }
      }
    );

    // Update team points if user is in a team
    if (team) {
      // Calculate total team points
      const teamMembers = await db.collection('users')
        .find({ 
          _id: { 
            $in: [...team.members, team.leaderId].map(id => new ObjectId(id))
          }
        })
        .toArray();

      const totalTeamPoints = teamMembers.reduce((sum, member) => sum + (member.ctfPoints || 0), 0);

      await db.collection('teams').updateOne(
        { _id: team._id },
        { 
          $set: { 
            totalPoints: totalTeamPoints,
            updatedAt: new Date()
          }
        }
      );

      // Emit socket event to update team members' UI
      const io = getIO();
      if (io) {
        teamMembers.forEach(member => {
          io.to(member._id.toString()).emit('challengeSolved', {
            challengeId,
            solvedByTeamMember: true
          });
        });
      }
    }

    // Emit general challenge update
    const io = getIO();
    if (io) {
      io.emit('challengeUpdate', {
        _id: challengeId,
        isSolved: true,
        solvedByTeam: !!team
      });
    }

    // Log the solve
    await db.collection('solves').insertOne({
      userId: userCheck._id.toString(),
      teamId: team?._id.toString(),
      challengeId: challengeId,
      timestamp: new Date(),
      points: challenge.points,
      isTeamSolve: !!team
    });

    console.log('Points update result:', {
      challengePoints: challenge.points,
      oldPoints: currentPoints,
      newPoints: newPoints,
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
      totalPoints: newPoints
    });

  } catch (error) {
    console.error('Error in flag submission:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
