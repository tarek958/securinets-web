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
    const { name, description, isPublic } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    // Check if team name already exists
    const existingTeam = await db.collection('teams').findOne({ name });
    if (existingTeam) {
      return NextResponse.json({ message: 'Team name already exists' }, { status: 400 });
    }

    // Check if user is already in a team
    const userTeam = await db.collection('teams').findOne({
      $or: [
        { leaderId: user.id },
        { members: user.id }
      ]
    });

    if (userTeam) {
      return NextResponse.json({ message: 'You are already in a team' }, { status: 400 });
    }

    const team = {
      name,
      description,
      isPublic,
      leaderId: user.id,
      members: [user.id], 
      pendingMembers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      solvedChallenges: [],
      points: 0
    };

    // If team is not public, generate a unique invite code
    if (!isPublic) {
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from(
          { length: 8 },
          () => chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
      };

      let isUnique = false;
      while (!isUnique) {
        team.inviteCode = generateCode();
        const existingTeam = await db.collection('teams').findOne({ inviteCode: team.inviteCode });
        if (!existingTeam) {
          isUnique = true;
        }
      }
    }

    const result = await db.collection('teams').insertOne(team);

    // Update user's team information
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.id) },
      { 
        $set: { 
          teamId: result.insertedId,
          teamRole: 'leader' 
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      teamId: result.insertedId,
      team: {
        ...team,
        _id: result.insertedId
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get('public') === 'true';

    const { db } = await connectToDatabase();
    
    // Only show public teams when publicOnly is true
    const query = publicOnly ? { isPublic: true } : {};
    const teams = await db.collection('teams')
      .find(query)
      .sort({ points: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      teams
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
