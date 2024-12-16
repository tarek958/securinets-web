import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    // Get user ID from headers
    const userId = request.headers.get('user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Find user's team
    const team = await db.collection('teams').findOne({
      $or: [
        { leaderId: userId },
        { members: userId }
      ]
    });

    if (!team) {
      // If user is not in a team, return empty array
      return NextResponse.json({ solvedChallenges: [] });
    }

    // Get all team members including leader
    const teamMemberIds = [...team.members, team.leaderId].map(id => 
      typeof id === 'string' ? new ObjectId(id) : id
    );

    // Get solved challenges from all team members
    const teamMembers = await db.collection('users')
      .find({ _id: { $in: teamMemberIds } })
      .toArray();

    // Combine all solved challenges from team members
    const allSolvedChallenges = teamMembers.reduce((acc, member) => {
      if (member.solvedChallenges) {
        acc.push(...member.solvedChallenges.map(id => id.toString()));
      }
      return acc;
    }, []);

    // Remove duplicates
    const uniqueSolvedChallenges = [...new Set(allSolvedChallenges)];

    return NextResponse.json({ solvedChallenges: uniqueSolvedChallenges });
  } catch (error) {
    console.error('Error fetching team solved challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team solved challenges' },
      { status: 500 }
    );
  }
}
