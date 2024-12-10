import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
export const dynamic = 'force-dynamic';
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
    const { db } = await connectToDatabase();
    
    // Get the user's actual data from the database
    const userId = user.sub || user._id || user.id;
    const userDoc = await db.collection('users').findOne({ 
      _id: new ObjectId(userId) 
    });

    if (!userDoc) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found' 
      }, { status: 404 });
    }

    // Find user's team
    const team = await db.collection('teams').findOne({
      $or: [
        { leaderId: userId },
        { members: userId },
        { leaderId: userDoc._id.toString() },
        { members: userDoc._id.toString() }
      ]
    });

    if (!team) {
      return NextResponse.json({ 
        success: false,
        message: 'No team found' 
      });
    }

    // Get team solves
    const solves = await db.collection('solves')
      .find({
        teamId: team._id.toString(),
        isTeamSolve: true
      })
      .sort({ timestamp: -1 })
      .toArray();

    // Calculate team stats
    const totalPoints = solves.reduce((sum, solve) => sum + (solve.points || 0), 0);
    const uniqueChallenges = new Set(solves.map(solve => solve.challengeId));

    // Get member details
    const memberIds = [...new Set([...team.members, team.leaderId])].map(id => {
      try {
        return new ObjectId(id);
      } catch (error) {
        return id;
      }
    });

    const members = await db.collection('users')
      .find({ 
        $or: [
          { _id: { $in: memberIds } },
          { _id: { $in: memberIds.map(id => id.toString()) } }
        ]
      })
      .project({ 
        _id: 1,
        username: 1,
        email: 1,
        solvedChallenges: 1,
        ctfPoints: 1
      })
      .toArray();

    // Create a map of usernames
    const userMap = members.reduce((map, user) => {
      map[user._id.toString()] = user.username;
      return map;
    }, {});

    // Get challenge details
    const challengeIds = [...uniqueChallenges].map(id => {
      try {
        return new ObjectId(id);
      } catch (error) {
        return id;
      }
    });

    const challenges = await db.collection('challenges')
      .find({ _id: { $in: challengeIds } })
      .project({
        _id: 1,
        title: 1,
        category: 1,
        points: 1,
        difficulty: 1
      })
      .toArray();

    // Create a map of challenges
    const challengeMap = challenges.reduce((map, challenge) => {
      map[challenge._id.toString()] = challenge;
      return map;
    }, {});

    // Enhance solves with user and challenge information
    const enhancedSolves = solves.map(solve => ({
      _id: solve._id,
      points: solve.points,
      timestamp: solve.timestamp,
      solver: {
        id: solve.userId,
        username: userMap[solve.userId] || 'Unknown'
      },
      challenge: challengeMap[solve.challengeId] || {
        id: solve.challengeId,
        title: 'Unknown Challenge',
        points: solve.points
      }
    }));

    // Calculate member solve counts and points
    const memberStats = members.map(member => {
      const memberSolves = solves.filter(solve => solve.userId === member._id.toString());
      return {
        _id: member._id,
        username: member.username,
        email: member.email,
        solvedCount: memberSolves.length,
        points: memberSolves.reduce((sum, solve) => sum + (solve.points || 0), 0)
      };
    });

    const teamData = {
      _id: team._id,
      name: team.name,
      isPublic: team.isPublic || false,
      inviteCode: team.inviteCode || null,
      leader: {
        id: team.leaderId,
        username: userMap[team.leaderId] || 'Unknown'
      },
      members: memberStats,
      stats: {
        totalPoints,
        uniqueChallengesCount: uniqueChallenges.size,
        solves: enhancedSolves
      }
    };

    return NextResponse.json({ 
      success: true,
      team: teamData
    });

  } catch (error) {
    console.error('Error in team dashboard:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
