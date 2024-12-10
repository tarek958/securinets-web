import { connectToDatabase } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return new Response(JSON.stringify({ success: false, message: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { challengeId, flag } = await req.json();
    if (!challengeId || !flag) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { db } = await connectToDatabase();

    // Get the challenge
    const challenge = await db.collection('challenges').findOne({
      _id: new ObjectId(challengeId)
    });

    if (!challenge) {
      return new Response(JSON.stringify({ success: false, message: 'Challenge not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if flag is correct
    if (challenge.flag !== flag) {
      return new Response(JSON.stringify({ success: false, message: 'Incorrect flag' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the current user
    const userId = authResult.user._id;
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user has already solved this challenge
    if (user.solvedChallenges && user.solvedChallenges.includes(challengeId)) {
      return new Response(JSON.stringify({ success: false, message: 'Challenge already solved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find user's team
    const team = await db.collection('teams').findOne({
      $or: [
        { leaderId: userId.toString() },
        { members: userId.toString() }
      ]
    });

    if (team) {
      // Check if team has already solved this challenge
      if (team.solvedChallenges && team.solvedChallenges.includes(challengeId)) {
        // Just add the solve for the current user without points
        await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $addToSet: { solvedChallenges: challengeId } }
        );

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Challenge marked as solved for you (already solved by team)',
          points: 0
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Award points to submitter and mark challenge as solved
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $addToSet: { solvedChallenges: challengeId },
          $inc: { ctfPoints: challenge.points }
        }
      );

      // Update team's solved challenges
      await db.collection('teams').updateOne(
        { _id: team._id },
        { 
          $addToSet: { 
            solvedChallenges: challengeId,
            solveDetails: {
              challengeId: challengeId,
              solvedBy: userId,
              timestamp: new Date(),
              points: challenge.points
            }
          }
        }
      );

      // Log the solve
      await db.collection('solves').insertOne({
        userId: userId,
        teamId: team._id,
        challengeId: challengeId,
        timestamp: new Date(),
        points: challenge.points,
        isTeamSolve: true
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Challenge solved! Points awarded to you and challenge marked as solved for your team.',
        points: challenge.points
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Individual solve (no team)
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $addToSet: { solvedChallenges: challengeId },
          $inc: { ctfPoints: challenge.points }
        }
      );

      // Log the solve
      await db.collection('solves').insertOne({
        userId: userId,
        challengeId: challengeId,
        timestamp: new Date(),
        points: challenge.points,
        isTeamSolve: false
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Challenge solved! Points awarded.',
        points: challenge.points
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in submit-flag:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
