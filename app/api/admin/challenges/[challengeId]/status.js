import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(request, context) {
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
    const data = await request.json();
    const { status } = data; // Expecting a field 'status' to update the challenge status

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Updating challenge status with ID:', challengeId, 'to status:', status);

    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(challengeId) },
      { $set: { status } }
    );
    console.log('Database update result:', result);

    if (result.modifiedCount > 0) {
      return NextResponse.json(
        { message: 'Challenge status updated successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to update challenge status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating challenge status:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the challenge status' },
      { status: 500 }
    );
  }
}
