import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// DELETE user
export async function DELETE(request, { params }) {
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

    const { userId } = params;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PATCH update user
export async function PATCH(request, { params }) {
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

    const { userId } = params;
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json(
        { error: 'Invalid role value' },
        { status: 400 }
      );
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
