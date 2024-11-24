import { connectToDatabase } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
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

    // Check if user has already solved this challenge
    const user = await db.collection('users').findOne({
      email: session.user.email,
      solvedChallenges: challengeId
    });

    if (user) {
      return new Response(JSON.stringify({ success: false, message: 'Challenge already solved' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update user's solved challenges and points
    await db.collection('users').updateOne(
      { email: session.user.email },
      { 
        $addToSet: { solvedChallenges: challengeId },
        $inc: { points: challenge.points }
      }
    );

    // Log the solve
    await db.collection('solves').insertOne({
      userId: user._id,
      challengeId: new ObjectId(challengeId),
      timestamp: new Date(),
      points: challenge.points
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Flag correct!',
      points: challenge.points 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error submitting flag:', error);
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
