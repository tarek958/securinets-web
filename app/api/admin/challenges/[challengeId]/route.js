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
    
    // Process hints with content and cost
    const hints = [];
    let index = 0;
    while (formData.has(`hints[${index}][content]`)) {
      const content = formData.get(`hints[${index}][content]`);
      const cost = parseInt(formData.get(`hints[${index}][cost]`) || '0');
      if (content && content.trim()) {
        hints.push({ content, cost });
      }
      index++;
    }
    
    const existingFiles = JSON.parse(formData.get('existingFiles') || '[]');

    // Process new files if any
    const files = formData.getAll('files');
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

    // Combine existing and new files
    const allFiles = [...existingFiles, ...processedFiles];

    // Determine update fields
    const updateFields = {
      title,
      description,
      category,
      difficulty,
      points,
      flag,
      status,
      hints,
      files: allFiles,
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => 
      updateFields[key] === undefined && delete updateFields[key]
    );

    // Await params from context
    const { challengeId } = await context.params;
    console.log('Updating challenge with ID:', challengeId);
    console.log('Update fields:', updateFields);

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
