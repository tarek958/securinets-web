import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

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
    
    // Find user's team (either as leader or member)
    const team = await db.collection('teams').findOne({
      $or: [
        { leaderId: user.id },
        { members: user.id }
      ]
    });

    if (!team) {
      return NextResponse.json({ 
        success: false,
        message: 'No team found' 
      });
    }

    // Get all members' details
    const memberIds = [...new Set([...team.members, team.leaderId])].map(id => new ObjectId(id));
    const members = await db.collection('users')
      .find({ _id: { $in: memberIds } })
      .project({ password: 0 }) // Exclude sensitive data
      .toArray();

    // Transform the team data
    const teamData = {
      ...team,
      members: members.map(member => ({
        _id: member._id.toString(),
        username: member.username,
        email: member.email
      }))
    };

    return NextResponse.json({
      success: true,
      team: teamData
    });

  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
