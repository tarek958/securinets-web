import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET write-ups for a challenge
export async function GET(request, context) {
  try {
    const { db } = await connectToDatabase();

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Fetching write-ups for challenge ID:', challengeId);

    const challenge = await db.collection('challenges').findOne({
      _id: new ObjectId(challengeId)
    }, { projection: { writeups: 1 } });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { writeups: challenge.writeups || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching write-ups:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching write-ups' },
      { status: 500 }
    );
  }
}

// POST add a write-up to a challenge
export async function POST(request, context) {
  try {
    const { db } = await connectToDatabase();

    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Parse JSON data from request body
    const { content } = await request.json();

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Adding write-up to challenge ID:', challengeId);

    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(challengeId) },
      { $push: { writeups: { content, createdBy: user.username, createdAt: new Date() } } }
    );

    if (result.modifiedCount > 0) {
      return NextResponse.json(
        { message: 'Write-up added successfully' },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to add write-up' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error adding write-up:', error);
    return NextResponse.json(
      { error: 'An error occurred while adding write-up' },
      { status: 500 }
    );
  }
}

// DELETE remove a write-up from a challenge
export async function DELETE(request, context) {
  try {
    const { db } = await connectToDatabase();

    // Get user data from headers
    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Parse JSON data from request body
    const { writeupId } = await request.json();

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Removing write-up from challenge ID:', challengeId);

    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(challengeId) },
      { $pull: { writeups: { _id: new ObjectId(writeupId) } } }
    );

    if (result.modifiedCount > 0) {
      return NextResponse.json(
        { message: 'Write-up removed successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to remove write-up' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error removing write-up:', error);
    return NextResponse.json(
      { error: 'An error occurred while removing write-up' },
      { status: 500 }
    );
  }
}
