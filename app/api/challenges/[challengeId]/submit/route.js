import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getIO, updateLeaderboard } from '@/lib/socket.js';

export async function POST(request, { params }) {
  try {
    const { db } = await connectToDatabase();
    const { flag } = await request.json();
    const challengeId = await params.challengeId;
    const userId = request.headers.get('user-id');
    const timestamp = new Date();
    const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for');

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
      userId
    });

    // Verify user is authenticated
    const userCheck = await db.collection('users').findOne({ 
      _id: new ObjectId(userId)
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

    // Get user's team
    const team = await db.collection('teams').findOne({
      $or: [
        { leaderId: userCheck._id.toString() },
        { members: userCheck._id.toString() }
      ]
    });

    // Check if user has already solved this challenge
    const alreadySolved = userCheck.solvedChallenges && 
      userCheck.solvedChallenges.some(id => id.toString() === challengeId.toString());
    
    if (alreadySolved) {
      // Log repeated attempt
      await db.collection('submissions').insertOne({
        userId: userCheck._id.toString(),
        teamId: team?._id.toString(),
        challengeId: challengeId,
        timestamp,
        flag,
        isCorrect: false,
        status: 'already_solved',
        ip
      });

      return NextResponse.json({ 
        success: false, 
        message: 'You have already solved this challenge' 
      }, { status: 400 });
    }

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
        // Log team repeated attempt
        await db.collection('submissions').insertOne({
          userId: userCheck._id.toString(),
          teamId: team._id.toString(),
          challengeId: challengeId,
          timestamp,
          flag,
          isCorrect: false,
          status: 'team_already_solved',
          ip
        });

        return NextResponse.json({ 
          success: false, 
          message: 'This challenge has already been solved by your team' 
        }, { status: 400 });
      }
    }

    // Verify flag
    const isCorrect = flag === challenge.flag;
    
    // Log the attempt in submissions collection
    await db.collection('submissions').insertOne({
      userId: userCheck._id.toString(),
      teamId: team?._id.toString(),
      challengeId: challengeId,
      timestamp,
      flag,
      isCorrect,
      status: isCorrect ? 'correct' : 'wrong_flag',
      points: isCorrect ? challenge.points : 0,
      ip
    });

    if (!isCorrect) {
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

    // Log the successful solve in solves collection
    await db.collection('solves').insertOne({
      userId: userCheck._id.toString(),
      teamId: team?._id.toString(),
      challengeId: challengeId,
      timestamp,
      points: challenge.points,
      isTeamSolve: !!team,
      ip
    });

    // Emit general challenge update
    const io = getIO();
    if (io) {
      io.emit('challengeUpdate', {
        _id: challengeId,
        isSolved: true,
        solvedByTeam: !!team
      });
    }

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
    console.error('Error in challenge submission:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
