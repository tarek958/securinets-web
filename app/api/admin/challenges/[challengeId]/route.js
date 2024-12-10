import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET single challenge
export async function GET(request, context) {
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

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Fetching challenge with ID:', challengeId);

    const challenge = await db.collection('challenges').findOne({
      _id: new ObjectId(challengeId)
    });
    console.log('Database query result:', challenge);

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenge' },
      { status: 500 }
    );
  }
}

// PATCH update challenge
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

    // Parse form data from request body
    const formData = await request.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const difficulty = formData.get('difficulty');
    const points = parseInt(formData.get('points'));
    const flag = formData.get('flag');
    const status = formData.get('status');
    const hints = formData.getAll('hints[]').filter(hint => hint.trim());
    const existingFiles = JSON.parse(formData.get('existingFiles') || '[]');

    // Determine update fields
    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (category) updateFields.category = category;
    if (difficulty) updateFields.difficulty = difficulty;
    if (points) updateFields.points = points;
    if (flag) updateFields.flag = flag;
    if (status) updateFields.status = status;
    if (hints) updateFields.hints = hints;
    if (existingFiles) updateFields.files = existingFiles;

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Updating challenge with ID:', challengeId);

    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(challengeId) },
      { $set: updateFields }
    );
    console.log('Database update result:', result);

    if (result.modifiedCount > 0) {
      return NextResponse.json(
        { message: 'Challenge updated successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to update challenge' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the challenge' },
      { status: 500 }
    );
  }
}

// DELETE challenge
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

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Deleting challenge with ID:', challengeId);

    const result = await db.collection('challenges').deleteOne({
      _id: new ObjectId(challengeId)
    });
    console.log('Database delete result:', result);

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Challenge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to delete challenge' },
      { status: 500 }
    );
  }
}
