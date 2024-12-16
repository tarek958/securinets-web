import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET all challenges (admin view)
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();

    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Admin sees all challenges regardless of status
    const challenges = await db.collection('challenges')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, challenges });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// POST create new challenge
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();

    const userData = request.headers.get('x-user-data');
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    
    // Process files if any
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

    const challenge = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      difficulty: formData.get('difficulty'),
      points: parseInt(formData.get('points')),
      flag: formData.get('flag'),
      hints: formData.getAll('hints[]').filter(hint => hint.trim()),
      files: processedFiles,
      status: formData.get('status') || 'inactive', // Use status from form data or default to inactive
      createdAt: new Date(),
      createdBy: user._id,
      solvedBy: []
    };

    // Log the challenge status for debugging
    console.log('Creating challenge with status:', challenge.status);

    const result = await db.collection('challenges').insertOne(challenge);

    return NextResponse.json({
      success: true,
      message: 'Challenge created successfully',
      challengeId: result.insertedId,
      status: challenge.status
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}
