import { connectToDatabase } from '@/lib/db';
import Challenge from '@/models/Challenge';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const authResult = await verifyAuth(request);
    
    // Get all active challenges
    const challenges = await db.collection('challenges')
      .find({ status: 'active' })
      .project({ flag: 0 }) // Exclude flag field
      .sort({ createdAt: -1 })
      .toArray();

    // If user is authenticated, get their solved challenges and team info
    if (authResult.user) {
      const userId = authResult.user._id;
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { solvedChallenges: 1 } }
      );

      if (user) {
        // Get user's team if they have one
        const team = await db.collection('teams').findOne({
          $or: [
            { leaderId: userId.toString() },
            { members: userId.toString() }
          ]
        });

        // If user is in a team, get all team members' solved challenges
        if (team) {
          const memberIds = [...new Set([...team.members, team.leaderId])]
            .map(id => {
              try {
                return new ObjectId(id);
              } catch (error) {
                return id;
              }
            });

          const teamMembers = await db.collection('users')
            .find({ _id: { $in: memberIds } })
            .project({ solvedChallenges: 1, _id: 1 })
            .toArray();

          // Mark challenges as solved if the current user has solved them
          challenges.forEach(challenge => {
            challenge.isSolved = user.solvedChallenges?.includes(challenge._id.toString());
            // Add team solve information
            challenge.solvedByTeam = teamMembers.some(
              member => member.solvedChallenges?.includes(challenge._id.toString())
            );
          });
        } else {
          // No team, just mark user's solved challenges
          challenges.forEach(challenge => {
            challenge.isSolved = user.solvedChallenges?.includes(challenge._id.toString());
            challenge.solvedByTeam = false;
          });
        }
      }
    }

    return NextResponse.json(challenges);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('Creating new challenge...');
    const data = await request.json();
    const { db } = await connectToDatabase();

    // Create new challenge
    const challenge = new Challenge({
      ...data,
      isActive: true,
    });

    await challenge.save();
    console.log('Challenge saved successfully:', challenge._id);

    // Get IO instance
    try {
      const io = getIO();
      if (io) {
        // Emit new challenge event to all connected clients
        const { flag, ...challengeWithoutFlag } = challenge.toObject();
        console.log('Emitting challengeAdded event to challenges room:', {
          challengeId: challengeWithoutFlag._id,
          title: challengeWithoutFlag.title
        });
        
        io.to('challenges').emit('challengeAdded', {
          message: 'New challenge available!',
          challenge: challengeWithoutFlag
        });
      }
    } catch (socketError) {
      console.error('Error emitting socket event:', socketError);
    }

    // Return the challenge without the flag
    const { flag: _, ...challengeWithoutFlag } = challenge.toObject();
    return NextResponse.json(challengeWithoutFlag);
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
