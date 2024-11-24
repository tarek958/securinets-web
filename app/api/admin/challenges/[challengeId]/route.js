import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET single challenge
export async function GET(request, { params }) {
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

    const challenge = await db.collection('challenges').findOne({
      _id: new ObjectId(params.challengeId)
    });

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

    const formData = await request.formData();
    const files = formData.getAll('files');

    // Process new files if any
    const processedFiles = await Promise.all(files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        data: buffer.toString('base64')
      };
    }));

    // Get existing files
    const existingFiles = JSON.parse(formData.get('existingFiles') || '[]');

    const updateData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      points: parseInt(formData.get('points')),
      flag: formData.get('flag'),
      hints: formData.getAll('hints[]').filter(hint => hint.trim()),
      files: [...existingFiles, ...processedFiles],
      status: formData.get('status'),
      updatedAt: new Date(),
      updatedBy: user._id
    };

    const result = await db.collection('challenges').updateOne(
      { _id: new ObjectId(params.challengeId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Challenge updated successfully'
    });
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Failed to update challenge' },
      { status: 500 }
    );
  }
}

// DELETE challenge
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

    const result = await db.collection('challenges').deleteOne({
      _id: new ObjectId(params.challengeId)
    });

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
