import { NextResponse } from 'next/server';
import { connectToDatabase as connectToDb } from '@/lib/db';
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
    if (!user.teamId) {
      return NextResponse.json({
        success: true,
        team: null
      });
    }

    const { db } = await connectToDb();

    // Get team data with member details
    const team = await db.collection('teams').findOne({
      _id: new ObjectId(user.teamId)
    });

    if (!team) {
      return NextResponse.json({
        success: false,
        message: 'Team not found'
      }, { status: 404 });
    }

    // Get member details
    const members = await db.collection('users')
      .find(
        { _id: { $in: team.members.map(id => new ObjectId(id)) } },
        { projection: { username: 1 } }
      )
      .toArray();

    // Add member details to team object
    team.members = members;

    return NextResponse.json({
      success: true,
      team
    });
  } catch (error) {
    console.error('Error fetching team data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
