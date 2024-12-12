import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    
    // Get all challenges with writeups
    const challenges = await db.collection('challenges')
      .find(
        { writeup: { $exists: true, $ne: null } },
        { projection: { title: 1, category: 1, difficulty: 1, points: 1, writeup: 1 } }
      )
      .toArray();

    return NextResponse.json({
      success: true,
      data: challenges
    });

  } catch (error) {
    console.error('Error fetching writeups:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch writeups' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Get user data from header
    const userDataHeader = request.headers.get('x-user-data');
    if (!userDataHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No user data' },
        { status: 403 }
      );
    }

    const userData = JSON.parse(userDataHeader);
    console.log('User Data from header:', userData);

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const { challengeId, writeup } = await request.json();

    if (!challengeId || typeof writeup !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid request - Challenge ID and writeup content are required' },
        { status: 400 }
      );
    }

    // Update the challenge with the new writeup
    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(challengeId) },
      { $set: { writeup, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    // Get the updated challenge
    const updatedChallenge = await db.collection('challenges').findOne(
      { _id: new ObjectId(challengeId) },
      { projection: { title: 1, category: 1, difficulty: 1, points: 1, writeup: 1 } }
    );

    return NextResponse.json({
      success: true,
      data: updatedChallenge,
      message: 'Writeup updated successfully'
    });

  } catch (error) {
    console.error('Error updating writeup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update writeup' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Get user data from header
    const userDataHeader = request.headers.get('x-user-data');
    if (!userDataHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No user data' },
        { status: 403 }
      );
    }

    const userData = JSON.parse(userDataHeader);
    console.log('User Data from header:', userData);

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { db } = await connectToDatabase();
    const { challengeId } = await request.json();

    if (!challengeId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request - Challenge ID is required' },
        { status: 400 }
      );
    }

    // Update the challenge to remove the writeup
    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(challengeId) },
      { 
        $unset: { writeup: "" },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Writeup deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting writeup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete writeup' 
      },
      { status: 500 }
    );
  }
}
